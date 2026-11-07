import { ApiClientProvider, createApiClient, type PlanResponse } from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { cerrarSesion, iniciarSesion } from '../../auth';
import { PlanesPage } from './PlanesPage';

const url = 'https://api.test/api/planes';
const tr: PlanResponse = {
  id: 'tr',
  codigo: 'TR',
  nombre: 'Todo Riesgo',
  descripcion: 'Cobertura amplia',
  primaBase: 27500,
  tiposPermitidos: 'Auto,Camioneta',
  antiguedadMaxima: 10,
  activo: true,
};
const rc: PlanResponse = {
  ...tr,
  id: 'rc',
  codigo: 'RC',
  nombre: 'Responsabilidad Civil',
  primaBase: 10000,
  antiguedadMaxima: null,
};
const listar = vi.fn(() => HttpResponse.json([rc, tr]));
const actualizar = vi.fn<(body: unknown) => Response | Promise<Response>>(() =>
  HttpResponse.json(tr),
);

beforeEach(() => {
  iniciarSesion({
    token: 'mock.token.test',
    rol: 'Administrador',
    expiraEn: new Date(Date.now() + 60000).toISOString(),
  });
  listar.mockClear();
  actualizar.mockClear();
  servidorMock.use(
    http.get(url, () => listar()),
    http.get(url + '/tr', () => HttpResponse.json(tr)),
    http.put(url + '/tr', async ({ request }) => actualizar(await request.json())),
  );
});

afterEach(() => cerrarSesion('manual'));

function montar() {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    ...render(
      <QueryClientProvider client={cache}>
        <ApiClientProvider client={createApiClient({ baseUrl: 'https://api.test' })}>
          <PlanesPage />
        </ApiClientProvider>
      </QueryClientProvider>,
    ),
    usuario: userEvent.setup(),
  };
}

async function editar() {
  const vista = montar();
  const accion = await screen.findByRole('button', { name: 'Editar plan TR' });
  await vista.usuario.click(accion);
  await screen.findByLabelText('Nombre');
  return vista;
}

const guardar = () => screen.getByRole('button', { name: 'Guardar cambios' });

it('muestra los encabezados del diseño', async () => {
  montar();
  const tabla = await screen.findByRole('table');
  expect(
    within(tabla)
      .getAllByRole('columnheader')
      .map((celda) => celda.textContent),
  ).toEqual(['Código', 'Nombre', 'Prima base', 'Tipos permitidos', 'Antigüedad máxima', 'Acción']);
});

it('formatea importes y antigüedades', async () => {
  montar();
  const fila = await screen.findByRole('row', { name: /Responsabilidad Civil/ });
  expect(within(fila).getByText(/\$\s10\.000,00/)).toBeInTheDocument();
  expect(within(fila).getByText('Sin límite')).toBeInTheDocument();
  expect(screen.getByText('10 años')).toBeInTheDocument();
});

it('selecciona la fila y carga el panel', async () => {
  await editar();
  expect(screen.getByRole('heading', { name: 'Editar plan TR' })).toBeInTheDocument();
  expect(screen.getByRole('row', { name: /Todo Riesgo/ })).toHaveAttribute('aria-current', 'true');
});

it('deshabilita el código y asocia su helper', async () => {
  await editar();
  const codigo = screen.getByLabelText('Código');
  expect(codigo).toBeDisabled();
  expect(codigo).toHaveAccessibleDescription('El código no se puede cambiar.');
});

it('refleja los tipos guardados', async () => {
  await editar();
  for (const [name, pressed] of [
    ['Auto', true],
    ['Camioneta', true],
    ['Moto', false],
  ] as const) {
    expect(screen.getByRole('button', { name, pressed })).toBeInTheDocument();
  }
});

it('impide guardar sin tipos', async () => {
  const { usuario } = await editar();
  await usuario.click(screen.getByRole('button', { name: 'Auto' }));
  await usuario.click(screen.getByRole('button', { name: 'Camioneta' }));
  await usuario.click(guardar());
  expect(
    await screen.findByText('Debe indicar al menos un tipo de vehículo permitido.'),
  ).toBeInTheDocument();
  expect(actualizar).not.toHaveBeenCalled();
});

it('impide guardar sin nombre', async () => {
  const { usuario } = await editar();
  await usuario.clear(screen.getByLabelText('Nombre'));
  await usuario.click(guardar());
  expect(await screen.findByText('El nombre del plan es obligatorio.')).toBeInTheDocument();
  expect(actualizar).not.toHaveBeenCalled();
});

it('envía el contrato completo con código y tipos canónicos', async () => {
  const { usuario } = await editar();
  await usuario.click(guardar());
  await screen.findByText('Cambios guardados.');
  expect(actualizar).toHaveBeenCalledWith({
    codigo: 'TR',
    nombre: tr.nombre,
    descripcion: tr.descripcion,
    primaBase: 27500,
    tiposPermitidos: 'Auto,Camioneta',
    antiguedadMaxima: 10,
  });
});

it('muestra éxito y actualiza la prima en la lista', async () => {
  const nuevo = { ...tr, primaBase: 28500 };
  actualizar.mockImplementationOnce(() => {
    listar.mockImplementationOnce(() => HttpResponse.json([rc, nuevo]));
    return HttpResponse.json(nuevo);
  });
  const { usuario } = await editar();
  const prima = screen.getByLabelText('Prima base mensual');
  await usuario.clear(prima);
  await usuario.type(prima, '28500,00');
  await usuario.click(guardar());
  expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument();
  expect(screen.getByText(/\$\s28\.500,00/)).toBeInTheDocument();
});

it('traduce errores de validación del backend bajo el campo', async () => {
  actualizar.mockReturnValueOnce(
    HttpResponse.json({ errors: { PrimaBase: ['Invalid amount'] } }, { status: 400 }),
  );
  const { usuario } = await editar();
  await usuario.click(guardar());
  expect(await screen.findByText('La prima base debe ser mayor que cero.')).toBeInTheDocument();
  expect(screen.getByLabelText('Prima base mensual')).toHaveAccessibleDescription(
    'La prima base debe ser mayor que cero.',
  );
  expect(screen.queryByText('Invalid amount')).not.toBeInTheDocument();
});

it('muestra el detail de negocio como alerta', async () => {
  const detail = "Ya existe otro plan con el código 'TR'.";
  actualizar.mockReturnValueOnce(HttpResponse.json({ detail }, { status: 400 }));
  const { usuario } = await editar();
  await usuario.click(guardar());
  expect(await screen.findByRole('alert')).toHaveTextContent(detail);
});

it('mantiene la alerta si el plan desaparece al refrescar la lista', async () => {
  actualizar.mockImplementationOnce(() => {
    listar.mockImplementationOnce(() => HttpResponse.json([rc]));
    return HttpResponse.json({ detail: 'El plan tr no existe.' }, { status: 404 });
  });
  const { usuario } = await editar();
  await usuario.click(guardar());
  expect(await screen.findByRole('alert')).toHaveTextContent('El plan tr no existe.');
  expect(listar).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('row', { name: /Todo Riesgo/ })).not.toBeInTheDocument();
});

it('cancela y restablece sin enviar cambios', async () => {
  const { usuario } = await editar();
  const nombre = screen.getByLabelText('Nombre');
  await usuario.clear(nombre);
  await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(nombre).toHaveValue(tr.nombre);
  expect(actualizar).not.toHaveBeenCalled();
});

it('envía un solo PUT con doble clic', async () => {
  let responder = () => {};
  const respuesta = new Promise<void>((resolve) => {
    responder = resolve;
  });
  actualizar.mockImplementationOnce(async () => {
    await respuesta;
    return HttpResponse.json(tr);
  });
  const { usuario } = await editar();
  try {
    await usuario.dblClick(guardar());
    expect(await screen.findByRole('button', { name: 'Guardando…' })).toBeDisabled();
  } finally {
    responder();
  }
  await screen.findByText('Cambios guardados.');
  expect(actualizar).toHaveBeenCalledTimes(1);
});

it('muestra el error de lista', async () => {
  listar.mockImplementationOnce(() => HttpResponse.json([], { status: 500 }));
  montar();
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar los planes.');
});

it('no presenta violaciones de accesibilidad con el editor abierto', async () => {
  const { container } = await editar();
  expect((await axe(container)).violations).toEqual([]);
});
