import { ApiClientProvider, createApiClient } from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { afterEach, expect, it } from 'vitest';
import { cerrarSesion, iniciarSesion } from '../../auth';
import { InicioPage } from './InicioPage';

const polizas = '*/api/polizas';
const cuotas = '*/api/cuotas';
const perfil = '*/api/auth/yo';
const datos: Record<string, number> = {
  Vigente: 312,
  Pendiente: 27,
  Suspendida: 9,
  Cancelada: 15,
  Vencida: 27,
};

const pagina = (total: number) =>
  HttpResponse.json({ items: [], pagina: 1, tamanoPagina: 1, total });

function simular({
  conteos = datos,
  nombre = 'Andrea',
  totalCuotas = 6,
}: {
  conteos?: Record<string, number>;
  nombre?: string | null;
  totalCuotas?: number | null;
} = {}) {
  servidorMock.use(
    http.get(polizas, ({ request }) =>
      pagina(conteos[new URL(request.url).searchParams.get('estado') ?? ''] ?? 0),
    ),
    http.get(perfil, () =>
      nombre ? HttpResponse.json({ nombre }) : new HttpResponse(null, { status: 404 }),
    ),
    http.get(cuotas, () =>
      totalCuotas === null ? new HttpResponse(null, { status: 500 }) : pagina(totalCuotas),
    ),
  );
}

function montar() {
  iniciarSesion({
    token: `mock.${btoa(JSON.stringify({ email: 'prueba@example.test' }))}.mock`,
    rol: 'Empleado',
    expiraEn: new Date(Date.now() + 60000).toISOString(),
  });
  const cliente = createApiClient({ baseUrl: 'https://api.test' });
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ApiClientProvider client={cliente}>
        <InicioPage />
      </ApiClientProvider>
    </QueryClientProvider>,
  );
}

function tarjeta(titulo: string) {
  const seccion = screen.getByRole('heading', { name: titulo }).closest('section');
  if (!seccion) throw new Error('Falta la tarjeta de ' + titulo);
  return within(seccion);
}

afterEach(() => cerrarSesion('manual'));

it('saluda con el nombre de yo', async () => {
  simular();
  montar();
  expect(await screen.findByRole('heading', { name: 'Hola, Andrea' })).toBeInTheDocument();
});

it('usa el email del claim cuando yo responde 404', async () => {
  simular({ nombre: null });
  montar();
  expect(
    await screen.findByRole('heading', { name: 'Hola, prueba@example.test' }),
  ).toBeInTheDocument();
});

it('muestra cuatro indicadores en el orden de la ficha', async () => {
  simular();
  montar();
  await screen.findByText('390');
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
    'Pólizas vigentes',
    'Pendientes de pago',
    'Suspendidas',
    'Cuotas vencidas hoy',
  ]);
});

it('consulta los cinco estados por nombre con página y tamaño 1', async () => {
  simular();
  const recibidos: Array<Record<string, string>> = [];
  servidorMock.use(
    http.get(polizas, ({ request }) => {
      recibidos.push(Object.fromEntries(new URL(request.url).searchParams));
      return pagina(2);
    }),
  );
  montar();
  await screen.findByText('10');
  expect(recibidos).toHaveLength(5);
  expect(recibidos).toEqual(
    expect.arrayContaining(
      Object.keys(datos).map((estado) => ({ estado, pagina: '1', tamano: '1' })),
    ),
  );
});

it('suma los cinco conteos en el centro del anillo', async () => {
  simular();
  montar();
  expect(await tarjeta('Pólizas por estado').findByText('390')).toBeInTheDocument();
});

it('calcula el porcentaje de las pólizas vigentes', async () => {
  simular();
  montar();
  expect(await tarjeta('Pólizas vigentes').findByText('80% de las pólizas')).toBeInTheDocument();
});

it('muestra 0% cuando no hay pólizas', async () => {
  simular({ conteos: {} });
  montar();
  expect(await screen.findByText('0% de las pólizas')).toBeInTheDocument();
  expect(tarjeta('Pólizas por estado').getAllByText('0%')).toHaveLength(5);
  expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
});

it('aísla un error al consultar un estado', async () => {
  simular();
  servidorMock.use(
    http.get(polizas, ({ request }) => {
      const estado = new URL(request.url).searchParams.get('estado') ?? '';
      return estado === 'Vigente' ? new HttpResponse(null, { status: 500 }) : pagina(datos[estado]);
    }),
  );
  montar();
  expect(
    await tarjeta('Pólizas vigentes').findByText('No pudimos cargar este dato.'),
  ).toBeInTheDocument();
  expect(await tarjeta('Pendientes de pago').findByText('27')).toBeInTheDocument();
  expect(
    await tarjeta('Pólizas por estado').findByText('No pudimos cargar este dato.'),
  ).toBeInTheDocument();
});

it('reintenta solamente el conteo fallido', async () => {
  simular();
  const pedidos: string[] = [];
  servidorMock.use(
    http.get(polizas, ({ request }) => {
      const estado = new URL(request.url).searchParams.get('estado') ?? '';
      const primerPedido = !pedidos.includes(estado);
      pedidos.push(estado);
      return estado === 'Vigente' && primerPedido
        ? new HttpResponse(null, { status: 500 })
        : pagina(datos[estado]);
    }),
  );
  montar();
  const boton = await tarjeta('Pólizas vigentes').findByRole('button', { name: 'Reintentar' });
  await waitFor(() => expect(pedidos).toHaveLength(5));
  await userEvent.click(boton);
  expect(await screen.findByText('390')).toBeInTheDocument();
  expect(pedidos).toHaveLength(6);
  expect(pedidos.at(-1)).toBe('Vigente');
});

it('muestra No disponible cuando PB-24 devuelve 500', async () => {
  simular({ totalCuotas: null });
  montar();
  expect(await tarjeta('Cuotas vencidas hoy').findByText('No disponible')).toBeInTheDocument();
  expect(await screen.findByText('390')).toBeInTheDocument();
});

it('muestra el chip y la nota de cuotas y consulta el filtro esperado', async () => {
  simular();
  const params: Array<Record<string, string>> = [];
  servidorMock.use(
    http.get(cuotas, ({ request }) => {
      params.push(Object.fromEntries(new URL(request.url).searchParams));
      return pagina(6);
    }),
  );
  montar();
  const widget = tarjeta('Cuotas vencidas hoy');
  expect(await widget.findByText('6')).toBeInTheDocument();
  expect(widget.getByText('Atender hoy')).toBeInTheDocument();
  expect(widget.getByText('Recargo 5% aplicado')).toBeInTheDocument();
  expect(params).toEqual([{ pagina: '1', tamano: '1', estado: 'Vencida' }]);
});

it('no agrega notas a pendientes ni suspendidas', async () => {
  simular();
  montar();
  await screen.findByText('390');
  expect(tarjeta('Pendientes de pago').queryByText(/cuota/i)).not.toBeInTheDocument();
  expect(tarjeta('Suspendidas').queryByText(/cuota/i)).not.toBeInTheDocument();
});

it('usa una leyenda accesible y oculta el SVG decorativo', async () => {
  simular();
  const { container } = montar();
  const lista = await tarjeta('Pólizas por estado').findByRole('list');
  expect(within(lista).getAllByRole('listitem')).toHaveLength(5);
  expect(within(lista).getByText('Vigente')).toBeInTheDocument();
  expect(container.querySelector('svg[viewBox="0 0 160 160"]')).toHaveAttribute(
    'aria-hidden',
    'true',
  );
});

it('muestra skeletons sin cifras mientras llegan los datos', async () => {
  simular();
  servidorMock.use(
    http.get(polizas, async () => {
      await delay('infinite');
      return pagina(1);
    }),
    http.get(cuotas, async () => {
      await delay('infinite');
      return pagina(1);
    }),
  );
  montar();
  expect(screen.getAllByRole('status', { name: 'Cargando indicador' })).toHaveLength(4);
  expect(screen.getByRole('status', { name: 'Cargando distribución' })).toBeInTheDocument();
  expect(screen.queryByText('0% de las pólizas')).not.toBeInTheDocument();
});

it('no muestra valores de muestra ni widgets fuera de alcance', async () => {
  simular({ conteos: { Vigente: 7 }, totalCuotas: 3, nombre: 'Andrea' });
  montar();
  await screen.findByText('100% de las pólizas');
  for (const texto of ['312', 'Mariela', '14', 'Tareas del día', 'Cuotas vencidas recientes']) {
    expect(screen.queryByText(texto, { exact: false })).not.toBeInTheDocument();
  }
});

it('no tiene violaciones de accesibilidad con datos', async () => {
  simular();
  const { container } = montar();
  await screen.findByText('390');
  await expectSinViolacionesA11y(container);
});
