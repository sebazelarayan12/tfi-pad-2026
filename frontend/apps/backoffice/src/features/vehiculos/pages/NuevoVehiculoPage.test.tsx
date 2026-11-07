import { clientesKeys, createApiClient, ApiClientProvider, vehiculosKeys } from '@nexa/api';
import { CLIENTE_JUAN_ID } from '@nexa/api/mocks/fixtures/clientes';
import { servidorMock } from '@nexa/api/mocks/server';
import { Toaster, toast } from '@nexa/ui';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { cerrarSesion, iniciarSesion } from '../../auth';
import { rutas } from '../routes';

const ficha = '/clientes/' + CLIENTE_JUAN_ID;
const postVehiculos = '*/api/vehiculos';
const getCliente = '*/api/clientes/:id';
const errorPatente = 'Ingresá una patente con formato AB123CD o ABC123.';

function montar(
  clienteId = CLIENTE_JUAN_ID,
  rol: 'Empleado' | 'Administrador' | null = 'Empleado',
) {
  if (rol) {
    iniciarSesion({
      token: 'mock',
      rol,
      expiraEn: new Date(Date.now() + 60_000).toISOString(),
    });
  }
  const cliente = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'mock' });
  const cache = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  const router = createMemoryRouter(
    [
      ...rutas,
      { path: '/clientes/:clienteId', element: <h1>Ficha de cliente</h1> },
      { path: '/clientes', element: <h1>Clientes</h1> },
    ],
    { initialEntries: ['/clientes/' + clienteId + '/vehiculos/nuevo'] },
  );
  const vista = render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={cache}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ApiClientProvider>,
  );
  return { ...vista, router, cache, usuario: userEvent.setup() };
}

afterEach(() => {
  toast.dismiss();
  cerrarSesion('manual');
});

function problema(status: number, datos: object = {}) {
  return HttpResponse.json(
    { status, title: 'Error', ...datos },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

const botonGuardar = () => screen.getByRole('button', { name: 'Guardar vehículo' });
async function campoHabilitado() {
  const campo = screen.getByRole('textbox', { name: 'Patente' });
  await waitFor(() => expect(campo).toBeEnabled());
  return campo;
}

it('muestra al cliente, las reglas y las opciones de uso accesibles con foco inicial en Patente', async () => {
  const { container } = montar();
  const patente = await campoHabilitado();
  expect(screen.getByRole('heading', { level: 1, name: 'Nuevo vehículo' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Juan Carlos Pérez' })).toHaveAttribute('href', ficha);
  expect(screen.getByText('30.123.456')).toBeInTheDocument();
  expect(patente).toHaveFocus();
  const uso = screen.getByRole('combobox', { name: 'Uso' });
  expect(uso).toHaveValue('0');
  expect(screen.getAllByRole('option').map((opcion) => opcion.textContent)).toEqual([
    'Particular',
    'Comercial',
  ]);
  expect(screen.getByRole('heading', { name: 'Reglas' })).toBeInTheDocument();
  expect(screen.queryByText('Validar en DNRPA')).not.toBeInTheDocument();
  expect(screen.queryByText('Datos informados por DNRPA')).not.toBeInTheDocument();
  expect(screen.queryByText('Ejemplo de error')).not.toBeInTheDocument();
  await expectSinViolacionesA11y(container);
});

it('mantiene el formulario deshabilitado mientras consulta al cliente', async () => {
  servidorMock.use(
    http.get(getCliente, async () => {
      await delay(100);
      return problema(404);
    }),
  );
  montar();
  expect(screen.getByRole('status')).toHaveTextContent('Cargando datos del cliente');
  expect(screen.getByRole('textbox', { name: 'Patente' })).toBeDisabled();
  expect(botonGuardar()).toBeDisabled();
  await screen.findByRole('heading', { name: 'Cliente no encontrado' });
});

it('bloquea una patente inválida, describe el error y no envía el POST', async () => {
  const post = vi.fn(() => problema(500));
  servidorMock.use(http.post(postVehiculos, post));
  const { container, usuario } = montar();
  const patente = await campoHabilitado();
  await usuario.type(patente, 'ab12cde');
  expect(patente).toHaveValue('AB12CDE');
  await usuario.click(botonGuardar());
  expect(await screen.findByText(errorPatente)).toBeInTheDocument();
  expect(patente).toHaveAttribute('aria-invalid', 'true');
  expect(patente).toHaveAccessibleDescription(errorPatente);
  expect(post).not.toHaveBeenCalled();
  await expectSinViolacionesA11y(container);
});

it('manda el body exacto con uso numérico, bloquea el doble clic y navega con el aviso', async () => {
  const post = vi.fn(async ({ request }: { request: Request }) => {
    const cuerpo: unknown = await request.json();
    expect(cuerpo).toEqual({ clienteId: CLIENTE_JUAN_ID, patente: 'AE789FG', uso: 1 });
    await delay(200);
    return HttpResponse.json({ patente: 'AE789FG' }, { status: 201 });
  });
  servidorMock.use(http.post(postVehiculos, post));
  const { usuario, router, cache } = montar(CLIENTE_JUAN_ID, 'Administrador');
  const invalidar = vi.spyOn(cache, 'invalidateQueries');
  const patente = await campoHabilitado();
  await usuario.type(patente, ' ae789fg ');
  expect(patente).toHaveValue(' AE789FG ');
  await usuario.selectOptions(screen.getByRole('combobox', { name: 'Uso' }), '1');
  await usuario.dblClick(botonGuardar());
  await waitFor(() => expect(botonGuardar()).toBeDisabled());
  expect(botonGuardar()).toHaveAttribute('aria-busy', 'true');
  expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  await screen.findByRole('heading', { name: 'Ficha de cliente' });
  expect(router.state.location.pathname).toBe(ficha);
  expect(router.state.location.state).toEqual({
    aviso: { tipo: 'exito', texto: 'Vehículo AE789FG agregado.' },
  });
  expect(await screen.findByText('Vehículo AE789FG agregado.')).toBeInTheDocument();
  expect(post).toHaveBeenCalledTimes(1);
  expect(invalidar).toHaveBeenCalledWith({ queryKey: clientesKeys.detalle(CLIENTE_JUAN_ID) });
  expect(invalidar).toHaveBeenCalledWith({
    queryKey: vehiculosKeys.listaPorCliente(CLIENTE_JUAN_ID),
  });
});

it.each(['patente', 'Patente'])(
  'marca el campo para errors.%s sin mostrar el texto del servidor',
  async (clave) => {
    servidorMock.use(
      http.post(postVehiculos, () =>
        problema(400, {
          errors: { [clave]: ['The Patente field is required.'] },
        }),
      ),
    );
    const { usuario } = montar();
    const patente = await campoHabilitado();
    await usuario.type(patente, 'AE789FG');
    await usuario.click(botonGuardar());
    expect(await screen.findByText(errorPatente)).toBeInTheDocument();
    expect(patente).toHaveAccessibleDescription(errorPatente);
    expect(patente).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(patente).toHaveFocus());
    expect(screen.queryByText('The Patente field is required.')).not.toBeInTheDocument();
  },
);

it.each([
  [
    400,
    "VEHICULO_NO_ENCONTRADO: La patente 'ZZ999ZZ' no figura en DNRPA.",
    "La patente 'ZZ999ZZ' no figura en DNRPA.",
  ],
  [400, 'RN03: El titular no coincide con el cliente.', 'El titular no coincide con el cliente.'],
  [
    400,
    "Ya existe un vehículo registrado con la patente 'AE789FG' (RN03).",
    "Ya existe un vehículo registrado con la patente 'AE789FG' (RN03).",
  ],
  [502, 'DNRPA no respondió a tiempo.', 'DNRPA no respondió a tiempo.'],
  [500, 'Ocurrió un error inesperado.', 'Ocurrió un error inesperado.'],
  [403, undefined, 'No se pudo completar la operación. Intentá de nuevo.'],
])(
  'muestra un aviso general para HTTP %s sin marcar Patente ni reintentar %#',
  async (status, detail, mensaje) => {
    const post = vi.fn(() => problema(status, { detail }));
    servidorMock.use(http.post(postVehiculos, post));
    const { usuario, router } = montar();
    const patente = await campoHabilitado();
    await usuario.type(patente, 'AE789FG');
    await usuario.click(botonGuardar());
    expect(await screen.findByText(mensaje)).toBeInTheDocument();
    expect(patente).not.toHaveAttribute('aria-invalid');
    expect(router.state.location.pathname).toBe(ficha + '/vehiculos/nuevo');
    expect(post).toHaveBeenCalledTimes(1);
  },
);

it.each(['no-es-guid', '00000000-0000-0000-0000-000000000099'])(
  'cliente inexistente %s no ofrece el alta',
  async (id) => {
    const get = vi.fn(() => problema(404));
    const post = vi.fn(() => problema(500));
    servidorMock.use(http.get(getCliente, get), http.post(postVehiculos, post));
    montar(id);
    expect(
      await screen.findByRole('heading', { name: 'Cliente no encontrado' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a clientes' })).toHaveAttribute(
      'href',
      '/clientes',
    );
    expect(screen.queryByRole('form', { name: 'Alta de vehículo' })).not.toBeInTheDocument();
    expect(get).toHaveBeenCalledTimes(id === 'no-es-guid' ? 0 : 1);
    expect(post).not.toHaveBeenCalled();
  },
);

it('si el cliente desaparece entre la consulta y el guardado muestra el estado de 404', async () => {
  servidorMock.use(http.post(postVehiculos, () => problema(404)));
  const { usuario } = montar();
  await usuario.type(await campoHabilitado(), 'AE789FG');
  await usuario.click(botonGuardar());
  expect(await screen.findByRole('heading', { name: 'Cliente no encontrado' })).toBeInTheDocument();
  expect(screen.queryByRole('form', { name: 'Alta de vehículo' })).not.toBeInTheDocument();
});

it('permite reintentar una consulta fallida del cliente', async () => {
  const get = vi.fn(() => problema(500, { detail: 'Falló la consulta.' }));
  servidorMock.use(http.get(getCliente, get));
  const { usuario } = montar();
  expect(await screen.findByRole('alert')).toHaveTextContent('Falló la consulta.');
  expect(get).toHaveBeenCalledTimes(2);
  servidorMock.resetHandlers();
  await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(await campoHabilitado()).toHaveFocus();
});

it('Cancelar vuelve a la ficha sin guardar', async () => {
  const post = vi.fn(() => problema(500));
  servidorMock.use(http.post(postVehiculos, post));
  const { usuario, router } = montar();
  await usuario.type(await campoHabilitado(), 'AE789FG');
  await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(router.state.location.pathname).toBe(ficha);
  expect(post).not.toHaveBeenCalled();
});

it('sin rol autorizado no consulta al cliente ni monta el formulario', () => {
  const get = vi.fn(() => problema(404));
  servidorMock.use(http.get(getCliente, get));
  montar(CLIENTE_JUAN_ID, null);
  expect(screen.getByText('No tenés permiso para esta acción.')).toBeInTheDocument();
  expect(screen.queryByRole('form', { name: 'Alta de vehículo' })).not.toBeInTheDocument();
  expect(get).not.toHaveBeenCalled();
});
