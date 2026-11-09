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

const flags = vi.hoisted(() => ({ inactivos: false, reactivar: false }));
vi.mock('../config', () => ({
  get FILTRO_INACTIVOS_DISPONIBLE() {
    return flags.inactivos;
  },
  get MOSTRAR_REACTIVAR() {
    return flags.reactivar;
  },
}));

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
  flags.inactivos = false;
  flags.reactivar = false;
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
  ).toEqual([
    'Código',
    'Nombre',
    'Prima base',
    'Tipos permitidos',
    'Antigüedad máxima',
    'Activo',
    'Acción',
  ]);
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

it('abre el alta con código editable y vacío', async () => {
  const { usuario } = montar();
  await usuario.click(screen.getByRole('button', { name: 'Nuevo plan' }));
  expect(screen.getByLabelText('Código')).toBeEnabled();
  expect(screen.getByLabelText('Código')).toHaveValue('');
  expect(screen.getByLabelText('Nombre')).toHaveValue('');
});

it('pide confirmar la baja y Escape la cancela sin enviar DELETE', async () => {
  const eliminar = vi.fn(() => new HttpResponse(null, { status: 204 }));
  servidorMock.use(http.delete(url + '/tr', eliminar));
  const { usuario } = montar();
  const fila = await screen.findByRole('row', { name: /Todo Riesgo/ });
  const activo = within(fila).getByRole('switch', { name: 'Activo', checked: true });
  await usuario.click(activo);
  const dialogo = screen.getByRole('alertdialog', { name: 'Desactivar plan TR' });
  expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  await usuario.keyboard('{Escape}');
  expect(dialogo).not.toBeInTheDocument();
  expect(activo).toHaveAttribute('aria-checked', 'true');
  expect(eliminar).not.toHaveBeenCalled();
});

async function prepararAlta() {
  const vista = montar();
  await vista.usuario.click(screen.getByRole('button', { name: 'Nuevo plan' }));
  await vista.usuario.type(screen.getByLabelText('Código'), 'XX');
  await vista.usuario.type(screen.getByLabelText('Nombre'), 'Plan nuevo');
  await vista.usuario.type(screen.getByLabelText('Descripción'), 'Cobertura');
  await vista.usuario.type(screen.getByLabelText('Prima base mensual'), '12345,00');
  await vista.usuario.click(screen.getByRole('button', { name: 'Auto' }));
  return vista.usuario;
}

it('crea un plan con el contrato completo y selecciona la respuesta', async () => {
  const nuevo = { ...rc, id: 'xx', codigo: 'XX', nombre: 'Plan nuevo' };
  const crear = vi.fn(async ({ request }: { request: Request }) => {
    expect(await request.json()).toEqual({
      codigo: 'XX',
      nombre: 'Plan nuevo',
      descripcion: 'Cobertura',
      primaBase: 12345,
      tiposPermitidos: 'Auto',
      antiguedadMaxima: null,
    });
    listar.mockReturnValueOnce(HttpResponse.json([rc, tr, nuevo]));
    return HttpResponse.json(nuevo, { status: 201 });
  });
  servidorMock.use(http.post(url, crear));
  const usuario = await prepararAlta();
  await usuario.dblClick(guardar());
  expect(await screen.findByRole('heading', { name: 'Editar plan XX' })).toBeInTheDocument();
  expect(crear).toHaveBeenCalledTimes(1);
});

it('muestra el código duplicado sin marcar campos', async () => {
  servidorMock.use(
    http.post(url, () =>
      HttpResponse.json({ detail: "Ya existe un plan con el código 'XX'." }, { status: 400 }),
    ),
  );
  const usuario = await prepararAlta();
  await usuario.click(guardar());
  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Ya existe un plan con el código 'XX'.",
  );
  expect(screen.getByLabelText('Código')).not.toHaveAttribute('aria-invalid', 'true');
});

it('desactiva una sola vez y cierra el editor del plan', async () => {
  const eliminar = vi.fn(() => {
    listar.mockReturnValueOnce(HttpResponse.json([rc]));
    return new HttpResponse(null, { status: 204 });
  });
  servidorMock.use(http.delete(url + '/tr', eliminar));
  const { usuario } = await editar();
  const panel = screen.getByRole('complementary', { name: 'Edición de plan' });
  await usuario.click(within(panel).getByRole('switch', { name: 'Activo', checked: true }));
  const dialogo = screen.getByRole('alertdialog');
  await usuario.dblClick(within(dialogo).getByRole('button', { name: 'Desactivar plan' }));
  expect(await screen.findByText('Seleccioná un plan para editarlo.')).toBeInTheDocument();
  expect(screen.queryByRole('row', { name: /Todo Riesgo/ })).not.toBeInTheDocument();
  expect(eliminar).toHaveBeenCalledTimes(1);
});

it('refresca el listado y muestra el detalle de una baja que devuelve 404', async () => {
  servidorMock.use(
    http.delete(url + '/tr', () =>
      HttpResponse.json({ detail: 'El plan tr no existe.' }, { status: 404 }),
    ),
  );
  const { usuario } = montar();
  const fila = await screen.findByRole('row', { name: /Todo Riesgo/ });
  await usuario.click(within(fila).getByRole('switch', { name: 'Activo' }));
  await usuario.click(screen.getByRole('button', { name: 'Desactivar plan' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('El plan tr no existe.');
  expect(listar).toHaveBeenCalledTimes(2);
});

it('no expone ni solicita inactivos con PB-09 deshabilitado', async () => {
  const incluirInactivos = vi.fn();
  servidorMock.use(
    http.get(url, ({ request }) => {
      if (new URL(request.url).searchParams.has('incluirInactivos')) incluirInactivos();
      return HttpResponse.json([rc, tr]);
    }),
  );
  montar();
  await screen.findByRole('table');
  expect(screen.queryByRole('checkbox', { name: 'Mostrar inactivos' })).not.toBeInTheDocument();
  expect(incluirInactivos).not.toHaveBeenCalled();
});

it('pide inactivos solo al marcar el filtro y muestra el badge sin reactivación', async () => {
  flags.inactivos = true;
  const consultarInactivos = vi.fn(() => HttpResponse.json([rc, { ...tr, activo: false }]));
  servidorMock.use(
    http.get(url, ({ request }) =>
      new URL(request.url).searchParams.get('incluirInactivos') === 'true'
        ? consultarInactivos()
        : HttpResponse.json([rc]),
    ),
  );
  const { usuario } = montar();
  await screen.findByRole('table');
  expect(consultarInactivos).not.toHaveBeenCalled();
  await usuario.click(screen.getByRole('checkbox', { name: 'Mostrar inactivos' }));
  const fila = await screen.findByRole('row', { name: /Todo Riesgo/ });
  expect(within(fila).getByText('Inactivo')).toBeInTheDocument();
  expect(within(fila).queryByRole('switch')).not.toBeInTheDocument();
  expect(consultarInactivos).toHaveBeenCalledTimes(1);
});

it('con ambos controles habilitados envía el PATCH de reactivación', async () => {
  flags.inactivos = true;
  flags.reactivar = true;
  const reactivar = vi.fn(async ({ request }: { request: Request }) => {
    expect(await request.json()).toEqual({ activo: true });
    return HttpResponse.json(tr);
  });
  servidorMock.use(
    http.get(url, ({ request }) =>
      new URL(request.url).searchParams.has('incluirInactivos')
        ? HttpResponse.json([{ ...tr, activo: reactivar.mock.calls.length > 0 }])
        : HttpResponse.json([rc]),
    ),
    http.patch(url + '/tr/activo', reactivar),
  );
  const { usuario } = montar();
  await usuario.click(screen.getByRole('checkbox', { name: 'Mostrar inactivos' }));
  const fila = await screen.findByRole('row', { name: /Todo Riesgo/ });
  await usuario.click(within(fila).getByRole('switch', { checked: false }));
  expect(await within(fila).findByRole('switch', { checked: true })).toBeInTheDocument();
  expect(reactivar).toHaveBeenCalledTimes(1);
});

it('cancelar el diálogo no envía la baja y el diálogo abierto pasa axe', async () => {
  const eliminar = vi.fn(() => new HttpResponse(null, { status: 204 }));
  servidorMock.use(http.delete(url + '/tr', eliminar));
  const { usuario, container } = montar();
  const fila = await screen.findByRole('row', { name: /Todo Riesgo/ });
  await usuario.click(within(fila).getByRole('switch', { checked: true }));
  expect((await axe(container)).violations).toEqual([]);
  await usuario.click(
    within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }),
  );
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(eliminar).not.toHaveBeenCalled();
});
