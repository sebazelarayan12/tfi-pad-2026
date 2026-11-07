import { ApiClientProvider, createApiClient, type CotizacionDto } from '@nexa/api';
import { CLIENTE_JUAN_ID } from '@nexa/api/mocks/fixtures/clientes';
import { COTIZACION_ID, VEHICULO_ID } from '@nexa/api/mocks/fixtures/vehiculos';
import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { cerrarSesion, iniciarSesion } from '../../auth';
import { rutas } from '../routes';

const ruta = '/polizas/nueva';
const apiCotizacion = '*/api/cotizaciones/:id';
const apiPolizas = '*/api/polizas';
const planId = 'a1000000-0000-0000-0000-000000000002';
const polizaId = 'd1000000-0000-0000-0000-000000000011';
const vencida = 'La cotización está vencida (RN06).';

function prepararCotizacion(cambios: Partial<CotizacionDto> = {}) {
  servidorMock.use(
    http.get(apiCotizacion, () =>
      HttpResponse.json({
        id: COTIZACION_ID,
        clienteId: CLIENTE_JUAN_ID,
        vehiculoId: VEHICULO_ID,
        planId,
        codigoPlan: 'TC',
        primaMensual: 19800,
        fechaCotizacion: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 86400000).toISOString(),
        origen: 0,
        ...cambios,
      }),
    ),
    http.get('*/api/planes/' + planId, () =>
      HttpResponse.json({ id: planId, codigo: 'TC', nombre: 'Terceros Completo' }),
    ),
  );
}

function montar(id = COTIZACION_ID) {
  iniciarSesion({
    token: 'mock',
    rol: 'Empleado',
    expiraEn: new Date(Date.now() + 60000).toISOString(),
  });
  const api = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'mock' });
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [...rutas, { path: '/polizas/:id', element: <h1>Detalle</h1> }],
    {
      initialEntries: [ruta + '?cotizacionId=' + id],
    },
  );
  const vista = render(
    <ApiClientProvider client={api}>
      <QueryClientProvider client={cache}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ApiClientProvider>,
  );
  return { ...vista, router, usuario: userEvent.setup() };
}

afterEach(() => cerrarSesion('manual'));

const botonEmitir = () => screen.getByRole('button', { name: 'Emitir póliza' });
const radio = (name: string) => screen.getByRole('radio', { name });
const esperarPlan = () => screen.findByText('TC Terceros Completo');

it('carga el resumen, deja la vigencia vacía y actualiza las cuotas con flechas', async () => {
  prepararCotizacion();
  const { usuario, container } = montar();
  await esperarPlan();
  expect(screen.getByText('Elegí una vigencia para ver las cuotas.')).toBeInTheDocument();
  expect(botonEmitir()).toBeDisabled();
  expect(screen.getByRole('radiogroup', { name: 'Vigencia' })).toBeInTheDocument();
  for (const opcion of screen.getAllByRole('radio')) expect(opcion).not.toBeChecked();
  expect(screen.getByLabelText('Fecha de inicio')).toHaveAttribute('readonly');
  await usuario.click(radio('1 mes'));
  await usuario.keyboard('{ArrowRight}');
  expect(radio('6 meses')).toBeChecked();
  const tabla = within(screen.getByRole('table', { name: 'Cuotas que se generan' }));
  expect(tabla.getAllByText('A confirmar')).toHaveLength(6);
  expect(tabla.getByText('6 de 6')).toBeInTheDocument();
  expect(screen.getByText(/118\.800,00/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Cotización' })).toHaveAttribute(
    'href',
    '/cotizaciones/nueva?vehiculoId=' + VEHICULO_ID + '&clienteId=' + CLIENTE_JUAN_ID,
  );
  await expectSinViolacionesA11y(container);
});

it('envía una sola emisión con la vigencia numérica y navega usando el id del 201', async () => {
  prepararCotizacion();
  const cuerpos: unknown[] = [];
  servidorMock.use(
    http.post(apiPolizas, async ({ request }) => {
      cuerpos.push(await request.json());
      await delay(120);
      return HttpResponse.json({ id: polizaId, numero: 'POL-123' }, { status: 201 });
    }),
  );
  const { usuario, router } = montar();
  await esperarPlan();
  await usuario.click(radio('6 meses'));
  await usuario.dblClick(botonEmitir());
  expect(botonEmitir()).toBeDisabled();
  expect(screen.getByText('Emitiendo póliza…')).toBeInTheDocument();
  await screen.findByRole('heading', { name: 'Detalle' });
  expect(cuerpos).toEqual([{ cotizacionId: COTIZACION_ID, vigenciaMeses: 6 }]);
  expect(router.state.location.pathname).toBe('/polizas/' + polizaId);
  expect(router.state.location.state).toEqual({
    aviso: { tipo: 'exito', texto: 'Póliza POL-123 emitida.' },
  });
});

it.each([
  [400, 'RN02: El cliente no está validado en Renaper.'],
  [500, 'Ocurrió un error inesperado.'],
])('muestra el detail literal del %s y no reintenta', async (status, detail) => {
  prepararCotizacion();
  const enviar = vi.fn(() => HttpResponse.json({ detail }, { status }));
  servidorMock.use(http.post(apiPolizas, enviar));
  const { usuario } = montar();
  await esperarPlan();
  await usuario.click(radio('12 meses'));
  await usuario.click(botonEmitir());
  expect(await screen.findByRole('alert')).toHaveTextContent(detail);
  expect(enviar).toHaveBeenCalledTimes(1);
});

it('usa la fecha de Argentina y deshabilita la emisión si venció', async () => {
  prepararCotizacion({ fechaVencimiento: '2020-11-12T02:30:00Z' });
  const { usuario } = montar();
  expect(await screen.findByText('Válida hasta 11/11/2020')).toBeInTheDocument();
  await usuario.click(radio('1 mes'));
  expect(screen.getByText(vencida)).toBeInTheDocument();
  expect(botonEmitir()).toBeDisabled();
});

it('un error de cliente muestra No disponible y permite emitir', async () => {
  prepararCotizacion();
  servidorMock.use(
    http.get('*/api/clientes/' + CLIENTE_JUAN_ID, () => new HttpResponse(null, { status: 404 })),
  );
  const { usuario } = montar();
  await esperarPlan();
  expect(await screen.findByText('No disponible')).toBeInTheDocument();
  await usuario.click(radio('1 mes'));
  expect(botonEmitir()).toBeEnabled();
});

it('rechaza el id inválido sin consultar la cotización', async () => {
  const leer = vi.fn(() => HttpResponse.json({}));
  servidorMock.use(http.get(apiCotizacion, leer));
  montar('invalido');
  expect(
    await screen.findByText('No se pudo abrir la emisión. Volvé a la cotización.'),
  ).toBeInTheDocument();
  expect(leer).not.toHaveBeenCalled();
});

it('un 404 de la cotización muestra su detalle sin renderizar el formulario', async () => {
  const detail = 'La cotización no existe.';
  servidorMock.use(http.get(apiCotizacion, () => HttpResponse.json({ detail }, { status: 404 })));
  montar();
  expect(await screen.findByRole('alert')).toHaveTextContent(detail);
  expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
});

it('bloquea la emisión si no se pudo cargar el plan', async () => {
  prepararCotizacion();
  servidorMock.use(
    http.get('*/api/planes/' + planId, () =>
      HttpResponse.json({ detail: 'El plan no existe.' }, { status: 404 }),
    ),
  );
  const { usuario } = montar();
  expect(await screen.findByRole('alert')).toHaveTextContent('El plan no existe.');
  await usuario.click(radio('1 mes'));
  expect(botonEmitir()).toBeDisabled();
});
