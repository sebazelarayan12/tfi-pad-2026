import { ApiClientProvider, createApiClient, pagoFacilKeys } from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { CUOTA_VENCIDA } from '@nexa/api/mocks/handlers/cuotas';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { cerrarSesion, iniciarSesion } from '../../auth';
import { InicioPage } from './InicioPage';

const polizas = '*/api/polizas';
const cuotas = '*/api/cuotas';
const perfil = '*/api/auth/yo';
const resumen = '*/api/inicio/resumen';
const rendiciones = '*/api/pagofacil/rendiciones';
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
    http.get(resumen, () => new HttpResponse(null, { status: 404 })),
    http.get(rendiciones, () => new HttpResponse(null, { status: 500 })),
  );
}

function montar() {
  iniciarSesion({
    token: `mock.${btoa(JSON.stringify({ email: 'prueba@example.test' }))}.mock`,
    rol: 'Empleado',
    expiraEn: new Date(Date.now() + 60000).toISOString(),
  });
  const cliente = createApiClient({ baseUrl: 'https://api.test' });
  const queryClient = new QueryClient();
  const vista = render(
    <QueryClientProvider client={queryClient}>
      <ApiClientProvider client={cliente}>
        <MemoryRouter initialEntries={['/inicio']}>
          <Routes>
            <Route path="/inicio" element={<InicioPage />} />
            <Route path="/pago-facil" element={<h1>Pago Fácil</h1>} />
          </Routes>
        </MemoryRouter>
      </ApiClientProvider>
    </QueryClientProvider>,
  );
  return { ...vista, queryClient };
}

function tarjeta(titulo: string) {
  const seccion = screen.getByRole('heading', { name: titulo }).closest('section');
  if (!seccion) throw new Error('Falta la tarjeta de ' + titulo);
  return within(seccion);
}

afterEach(() => {
  cerrarSesion('manual');
  vi.useRealTimers();
});

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
  expect(params.filter(({ tamano }) => tamano === '1')).toEqual([
    { pagina: '1', tamano: '1', estado: 'Vencida' },
  ]);
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
  for (const texto of ['312', 'Mariela', '14', 'Tomás', 'Tareas del día', 'Ver todas']) {
    expect(screen.queryByText(texto, { exact: false })).not.toBeInTheDocument();
  }
});

it('no tiene violaciones de accesibilidad con datos', async () => {
  simular();
  const { container } = montar();
  await screen.findByText('390');
  await expectSinViolacionesA11y(container);
});

const datosCuotas = Array.from({ length: 6 }, (_, indice) => ({
  ...CUOTA_VENCIDA,
  cuotaId: `cuota-${indice}`,
  numeroCuota: indice + 1,
}));

function mockListaCuotas(items = datosCuotas) {
  const filtros = vi.fn();
  servidorMock.use(
    http.get(cuotas, ({ request }) => {
      const params = Object.fromEntries(new URL(request.url).searchParams);
      if (params.tamano === '1') return pagina(items.length);
      filtros(params);
      return HttpResponse.json({ items, total: items.length, pagina: 1, tamanoPagina: 5 });
    }),
  );
  return filtros;
}

const tablaCuotas = () => screen.findByRole('table', { name: 'Cuotas vencidas recientes' });

it('muestra hasta cinco cuotas y los encabezados de la ficha', async () => {
  simular();
  mockListaCuotas();
  montar();
  const tabla = within(await tablaCuotas());
  expect(tabla.getAllByRole('row')).toHaveLength(6);
  expect(tabla.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
    'Cliente',
    'Póliza',
    'Cuota y vencimiento',
    'Importe',
    'Estado',
  ]);
  expect(tabla.getAllByText('Juan Carlos Pérez')).toHaveLength(5);
  expect(tabla.getAllByText('Vencida')).toHaveLength(5);
});

it('formatea el importe total con recargo', async () => {
  simular();
  mockListaCuotas();
  montar();
  expect(within(await tablaCuotas()).getAllByText(/\$\s12\.600,00/)).toHaveLength(5);
});

it('muestra el número de cuota y el DateOnly', async () => {
  simular();
  mockListaCuotas();
  montar();
  expect(within(await tablaCuotas()).getByText('Cuota 1 · 10/01/2027')).toBeInTheDocument();
});

it('pide la lista con los filtros exactos', async () => {
  simular();
  const filtros = mockListaCuotas();
  montar();
  await tablaCuotas();
  expect(filtros).toHaveBeenCalledExactlyOnceWith({
    estado: 'Vencida',
    pagina: '1',
    tamano: '5',
    orden: 'fechaVencimiento',
  });
});

it('usa caption y encabezados accesibles', async () => {
  simular();
  mockListaCuotas();
  montar();
  const tabla = await tablaCuotas();
  expect(tabla.querySelector('caption')).toHaveTextContent('Cuotas vencidas recientes');
  for (const th of within(tabla).getAllByRole('columnheader'))
    expect(th).toHaveAttribute('scope', 'col');
});

it('enlaza al detalle de la póliza', async () => {
  simular();
  mockListaCuotas();
  montar();
  const enlace = within(await tablaCuotas()).getAllByRole('link', {
    name: CUOTA_VENCIDA.numeroPoliza,
  })[0];
  expect(enlace).toHaveAttribute('href', `/polizas/${CUOTA_VENCIDA.polizaId}`);
});

it('muestra el mensaje de lista vacía', async () => {
  simular();
  mockListaCuotas([]);
  montar();
  expect(await screen.findByText('No hay cuotas vencidas.')).toBeInTheDocument();
});

it('reintenta la lista al pulsar Reintentar', async () => {
  simular();
  let intentos = 0;
  servidorMock.use(
    http.get(cuotas, ({ request }) => {
      if (new URL(request.url).searchParams.get('tamano') === '1') return pagina(1);
      intentos += 1;
      return intentos === 1 ? new HttpResponse(null, { status: 500 }) : pagina(0);
    }),
  );
  montar();
  const widget = tarjeta('Cuotas vencidas recientes');
  expect(await widget.findByRole('alert')).toHaveTextContent('No pudimos cargar las cuotas.');
  await userEvent.click(widget.getByRole('button', { name: 'Reintentar' }));
  expect(await widget.findByText('No hay cuotas vencidas.')).toBeInTheDocument();
  expect(intentos).toBe(2);
});

it('muestra cinco filas de skeleton mientras carga la lista', () => {
  simular();
  montar();
  const skeleton = screen.getByRole('status', { name: 'Cargando cuotas vencidas' });
  expect(skeleton.children).toHaveLength(5);
});

function mockHistorial(fecha?: string) {
  vi.setSystemTime(new Date('2026-11-07T01:00:00Z'));
  const pedidos = vi.fn(() => HttpResponse.json(fecha ? [{ fechaRendicion: fecha }] : []));
  servidorMock.use(http.get(rendiciones, pedidos));
  return pedidos;
}

it('muestra la promo con una rendición de ayer en Argentina', async () => {
  simular();
  mockHistorial('2026-11-05');
  montar();
  expect(
    await screen.findByRole('heading', { name: 'Rendición de Pago Fácil disponible' }),
  ).toBeInTheDocument();
});

it('oculta la promo con una rendición de hoy en Argentina', async () => {
  simular();
  mockHistorial('2026-11-06');
  const { queryClient } = montar();
  await waitFor(() =>
    expect(queryClient.getQueryState(pagoFacilKeys.rendiciones())?.status).toBe('success'),
  );
  expect(screen.queryByRole('link', { name: 'Ir a rendición' })).not.toBeInTheDocument();
});

it('oculta la promo si el historial falla', async () => {
  simular();
  const { queryClient } = montar();
  await waitFor(() =>
    expect(queryClient.getQueryState(pagoFacilKeys.rendiciones())?.status).toBe('error'),
  );
  expect(screen.queryByRole('link', { name: 'Ir a rendición' })).not.toBeInTheDocument();
});

it('navega a Pago Fácil desde el enlace de la promo', async () => {
  simular();
  mockHistorial();
  montar();
  await userEvent.click(await screen.findByRole('link', { name: 'Ir a rendición' }));
  expect(await screen.findByRole('heading', { name: 'Pago Fácil' })).toBeInTheDocument();
});

it('usa la fecha de corte del resumen y las cifras de B-02', async () => {
  simular();
  vi.setSystemTime(new Date('2026-11-07T01:00:00Z'));
  servidorMock.use(http.get(resumen, () => HttpResponse.json({ fechaCorte: '2026-10-28' })));
  montar();
  expect(
    await screen.findByText('Hay 6 cuotas vencidas y 27 pólizas pendientes de pago al 28/10/2026.'),
  ).toBeInTheDocument();
});

it('oculta la línea de resumen ante un 500 sin ocultar los indicadores', async () => {
  simular();
  const pedido = vi.fn(() => new HttpResponse(null, { status: 500 }));
  servidorMock.use(http.get(resumen, pedido));
  montar();
  await waitFor(() => expect(pedido).toHaveBeenCalled());
  expect(await screen.findByText('80% de las pólizas')).toBeInTheDocument();
  expect(screen.queryByText(/^Hay .*cuotas vencidas/)).not.toBeInTheDocument();
});

it('verifica accesibilidad con el widget y la promo visibles', async () => {
  simular();
  mockListaCuotas();
  mockHistorial();
  const { container } = montar();
  await tablaCuotas();
  await screen.findByRole('link', { name: 'Ir a rendición' });
  await expectSinViolacionesA11y(container);
});
