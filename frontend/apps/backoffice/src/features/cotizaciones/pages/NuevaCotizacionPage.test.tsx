import { ApiClientProvider, createApiClient } from '@nexa/api';
import { CLIENTE_JUAN_ID, CLIENTE_LUCIA_ID } from '@nexa/api/mocks/fixtures/clientes';
import { VEHICULO_BAJA_ID, VEHICULO_ID } from '@nexa/api/mocks/fixtures/vehiculos';
import { servidorMock } from '@nexa/api/mocks/server';
import { Toaster, toast } from '@nexa/ui';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { cerrarSesion, iniciarSesion } from '../../auth';
import { NuevaCotizacionPage } from './NuevaCotizacionPage';

const ruta = '/cotizaciones/nueva';
const endpoint = '*/api/cotizaciones';

function montar(busqueda = '?vehiculoId=' + VEHICULO_ID + '&clienteId=' + CLIENTE_JUAN_ID) {
  iniciarSesion({
    token: 'mock',
    rol: 'Empleado',
    expiraEn: new Date(Date.now() + 60000).toISOString(),
  });
  const api = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'mock' });
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: ruta, element: <NuevaCotizacionPage /> },
      { path: '/clientes', element: <h1>Clientes</h1> },
      { path: '/polizas/nueva', element: <h1>Emitir póliza</h1> },
    ],
    { initialEntries: [ruta + busqueda] },
  );
  const vista = render(
    <ApiClientProvider client={api}>
      <QueryClientProvider client={cache}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ApiClientProvider>,
  );
  return { ...vista, router, usuario: userEvent.setup() };
}

afterEach(() => {
  toast.dismiss();
  cerrarSesion('manual');
});

it('no cotiza al montar y bloquea Continuar sin selección', async () => {
  const post = vi.fn(() => HttpResponse.json({}));
  servidorMock.use(http.post(endpoint, post));
  montar();
  await screen.findByText(/Toyota Corolla XEi/);
  expect(post).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Continuar a emisión' })).toBeDisabled();
});

const opciones = [
  { idCotizacion: 'id-tr', codigoPlan: 'TR', plan: 'Todo Riesgo', primaMensual: 30250 },
  { idCotizacion: 'id-rc', codigoPlan: 'RC', plan: 'Responsabilidad Civil', primaMensual: 11000 },
  { idCotizacion: 'id-tc', codigoPlan: 'TC', plan: 'Terceros Completo', primaMensual: 19800 },
];
const botonCotizar = () => screen.getByRole('button', { name: 'Cotizar' });
const continuar = () => screen.getByRole('button', { name: 'Continuar a emisión' });

function respuestaCotizacion(fechaVencimiento = new Date(Date.now() + 3600000).toISOString()) {
  return HttpResponse.json({ opciones, fechaVencimiento }, { status: 201 });
}

async function esperarContexto() {
  await screen.findByText(/Toyota Corolla XEi/);
  await waitFor(() => expect(botonCotizar()).toBeEnabled());
}

it('envía un solo POST con el ID del vehículo, bloquea el doble clic y ordena las primas', async () => {
  const post = vi.fn(async ({ request }: { request: Request }) => {
    expect(await request.json()).toEqual({ vehiculoId: VEHICULO_ID });
    await delay(200);
    return respuestaCotizacion();
  });
  servidorMock.use(http.post(endpoint, post));
  const { usuario, container } = montar();
  await esperarContexto();
  await usuario.dblClick(botonCotizar());
  const calculando = await screen.findByRole('button', { name: 'Calculando planes…' });
  expect(calculando).toBeDisabled();
  expect(calculando).toHaveAttribute('aria-busy', 'true');
  const grupo = await screen.findByRole('radiogroup', { name: 'Planes compatibles' });
  const radios = within(grupo).getAllByRole('radio');
  expect(radios.map((radio) => radio.getAttribute('value'))).toEqual(['id-rc', 'id-tc', 'id-tr']);
  for (const radio of radios) expect(radio).not.toBeChecked();
  expect(continuar()).toBeDisabled();
  expect(post).toHaveBeenCalledTimes(1);
  expect(container.querySelector('aside[data-slot="rail"]')).toBeEmptyDOMElement();
});

it('ofrece radios accesibles y pasa a emisión el ID de la opción elegida', async () => {
  servidorMock.use(http.post(endpoint, () => respuestaCotizacion()));
  const { usuario, router, container } = montar();
  await esperarContexto();
  await usuario.click(botonCotizar());
  const tc = await screen.findByRole('radio', {
    name: /TC Terceros Completo, prima mensual \$\s19\.800,00/,
  });
  expect(screen.getByText(/\$\s19\.800,00/)).toBeInTheDocument();
  expect(screen.getByText('Seleccioná un plan para continuar')).toBeInTheDocument();
  await usuario.click(tc);
  expect(tc).toBeChecked();
  expect(tc).toHaveAttribute('aria-checked', 'true');
  expect(continuar()).toBeEnabled();
  for (const texto of [
    'Guardar cotización',
    'Cambiar datos',
    'Recomendado',
    'Datos de la cotización',
  ]) {
    expect(screen.queryByText(texto)).not.toBeInTheDocument();
  }
  await expectSinViolacionesA11y(container);
  await usuario.click(continuar());
  expect(router.state.location.pathname).toBe('/polizas/nueva');
  expect(router.state.location.search).toBe('?cotizacionId=id-tc');
});

it('une el catálogo por código y omite descripciones de planes sin coincidencia', async () => {
  servidorMock.use(
    http.get('*/api/planes', () =>
      HttpResponse.json([{ codigo: 'RC', descripcion: 'Descripción de prueba para RC.' }]),
    ),
    http.post(endpoint, () => respuestaCotizacion()),
  );
  const { usuario } = montar();
  await esperarContexto();
  await usuario.click(botonCotizar());
  const rc = await screen.findByRole('radio', { name: /^RC / });
  const tc = screen.getByRole('radio', { name: /^TC / });
  await waitFor(() => expect(rc).toHaveAccessibleDescription('Descripción de prueba para RC.'));
  expect(tc).not.toHaveAttribute('aria-describedby');
});

it('muestra el día en Argentina y bloquea emitir una cotización vencida', async () => {
  servidorMock.use(http.post(endpoint, () => respuestaCotizacion('2020-11-12T02:30:00Z')));
  const { usuario } = montar();
  await esperarContexto();
  await usuario.click(botonCotizar());
  expect(await screen.findByText('Vencida el 11/11/2020')).toBeInTheDocument();
  await usuario.click(screen.getByRole('radio', { name: /^TC / }));
  expect(continuar()).toHaveAttribute('aria-disabled', 'true');
  expect(continuar()).toBeDisabled();
  expect(botonCotizar()).toBeEnabled();
});

it.each([
  [400, 'Ningún plan es compatible con el vehículo.', 'Ningún plan es compatible con el vehículo.'],
  [404, 'El vehículo no existe.', 'El vehículo no existe.'],
  [500, undefined, 'No se pudo cotizar el vehículo. Intentá de nuevo.'],
])(
  'muestra el error de cotización %s y deja que el usuario decida si vuelve a intentar',
  async (status, detail, mensaje) => {
    const post = vi.fn(() =>
      HttpResponse.json(
        { status, title: 'Error', detail },
        { status, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    );
    servidorMock.use(http.post(endpoint, post));
    const { usuario } = montar();
    await esperarContexto();
    await usuario.click(botonCotizar());
    expect(await screen.findByText(mensaje)).toBeInTheDocument();
    expect(post).toHaveBeenCalledTimes(1);
    expect(botonCotizar()).toBeEnabled();
    expect(continuar()).toBeDisabled();
  },
);

it.each(['', '?vehiculoId=invalido'])(
  'redirige sin pedir datos con parámetros %j',
  async (busqueda) => {
    const vehiculo = vi.fn(() => HttpResponse.json({}));
    const post = vi.fn(() => HttpResponse.json({}));
    servidorMock.use(http.get('*/api/vehiculos/:id', vehiculo), http.post(endpoint, post));
    montar(busqueda);
    await screen.findByRole('heading', { name: 'Clientes' });
    expect(vehiculo).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  },
);

it('usa el titular informado por el vehículo cuando falta el cliente de la URL', async () => {
  montar('?vehiculoId=' + VEHICULO_ID);
  expect(await screen.findByText('Juan Carlos Pérez')).toBeInTheDocument();
  expect(screen.getByText(/30\.123\.456/)).toBeInTheDocument();
});

it('si falla el contexto del vehículo, muestra el error y no deja cotizar', async () => {
  servidorMock.use(
    http.get('*/api/vehiculos/:id', () =>
      HttpResponse.json(
        { status: 404, title: 'Error', detail: 'El vehículo no existe.' },
        { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    ),
  );
  montar();
  expect(await screen.findByRole('alert')).toHaveTextContent('El vehículo no existe.');
  expect(botonCotizar()).toBeDisabled();
});

it('al cambiar de vehículo limpia las opciones y no cotiza automáticamente', async () => {
  const post = vi.fn(() => respuestaCotizacion());
  servidorMock.use(http.post(endpoint, post));
  const { router, usuario } = montar();
  await esperarContexto();
  await usuario.click(botonCotizar());
  await usuario.click(await screen.findByRole('radio', { name: /^TC / }));
  await act(() => router.navigate(ruta + '?vehiculoId=' + VEHICULO_BAJA_ID));
  await screen.findByText('ABC123');
  expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  expect(continuar()).toBeDisabled();
  expect(post).toHaveBeenCalledTimes(1);
});

it('un cliente de la URL que no coincide no reemplaza al titular del vehículo', async () => {
  const otroCliente = vi.fn(() => HttpResponse.json({}));
  servidorMock.use(http.get('*/api/clientes/' + CLIENTE_LUCIA_ID, otroCliente));
  montar('?vehiculoId=' + VEHICULO_ID + '&clienteId=' + CLIENTE_LUCIA_ID);
  expect(await screen.findByText('Juan Carlos Pérez')).toBeInTheDocument();
  expect(otroCliente).not.toHaveBeenCalled();
});

it('una nueva cotización limpia la selección anterior', async () => {
  servidorMock.use(http.post(endpoint, () => respuestaCotizacion()));
  const { usuario } = montar();
  await esperarContexto();
  await usuario.click(botonCotizar());
  await usuario.click(await screen.findByRole('radio', { name: /^TC / }));
  expect(continuar()).toBeEnabled();
  await usuario.click(botonCotizar());
  expect(await screen.findByRole('radio', { name: /^TC / })).not.toBeChecked();
  expect(continuar()).toBeDisabled();
});
