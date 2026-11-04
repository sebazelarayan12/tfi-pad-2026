import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';
import {
  actualizarUsuarioMock,
  cambiarActivoUsuarioMock,
  crearUsuario,
  createApiClient,
  listarUsuariosMock,
  loginRequest,
  obtenerYoMock,
  usuariosKeys,
  type CrearUsuarioRequest,
} from '@nexa/api';
import {
  crearHandlersUsuarios,
  tokensMockUsuarios,
  variantesUsuarios,
} from '../../mocks/handlers/usuarios';
import { servidorMock } from '../../mocks/server';

const baseUrl = 'https://api.test';
const anonimo = createApiClient({ baseUrl });
const admin = createApiClient({ baseUrl, getToken: () => tokensMockUsuarios.administrador });
const empleado = createApiClient({ baseUrl, getToken: () => tokensMockUsuarios.empleado });
const alta = '/api/auth/usuarios';
const datos: CrearUsuarioRequest = {
  email: 'empleado.nuevo@example.test',
  password: 'valor-ficticio-de-test',
  rol: 'Empleado',
  nombre: 'Ana',
  apellido: 'Gómez',
};

beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => servidorMock.use(...crearHandlersUsuarios()));
afterEach(() => servidorMock.resetHandlers());
afterAll(() => servidorMock.close());

it('devuelve 201 con solo id, email y rol', async () => {
  const respuesta = await admin.post(alta, datos, { responseType: 'raw' });
  expect(respuesta.status).toBe(201);
  expect(JSON.parse(respuesta.texto)).toEqual({
    id: expect.any(String),
    email: datos.email,
    rol: datos.rol,
  });
});

it.each(['Administrador', 'Empleado'] as const)('envía el rol exacto %s', async (rol) => {
  servidorMock.use(
    http.post(`*${alta}`, async ({ request }) => {
      const body = await request.json();
      expect(body).toEqual({ ...datos, rol });
      return HttpResponse.json({ id: 'usuario-prueba', email: datos.email, rol }, { status: 201 });
    }),
  );
  await expect(crearUsuario(admin, { ...datos, rol })).resolves.toMatchObject({ rol });
});

it.each([
  [{ email: '' }, 'Email', 'El email es obligatorio.'],
  [{ email: 'invalido' }, 'Email', 'El email no tiene un formato válido.'],
  [{ password: '' }, 'Password', 'La contraseña es obligatoria.'],
  [{ nombre: '' }, 'Nombre', 'El nombre es obligatorio.'],
  [{ apellido: '' }, 'Apellido', 'El apellido es obligatorio.'],
] as const)('devuelve 400 de validación en PascalCase', async (parche, campo, mensaje) => {
  await expect(crearUsuario(admin, { ...datos, ...parche })).rejects.toMatchObject({
    status: 400,
    errors: { [campo]: [mensaje] },
  });
});

it('devuelve error de campo cuando falta el rol', async () => {
  const { email, password, nombre, apellido } = datos;
  await expect(admin.post(alta, { email, password, nombre, apellido })).rejects.toMatchObject({
    status: 400,
    errors: { Rol: ['El rol es obligatorio.'] },
  });
});

it('conserva el detalle de email duplicado', async () => {
  await crearUsuario(admin, datos);
  await expect(
    crearUsuario(admin, { ...datos, email: datos.email.toUpperCase() }),
  ).rejects.toMatchObject({
    status: 400,
    detail: 'El email ya está registrado.',
  });
});

it('conserva el detalle completo de Identity', async () => {
  servidorMock.use(variantesUsuarios.contrasenaRechazada);
  await expect(crearUsuario(admin, datos)).rejects.toMatchObject({
    status: 400,
    detail:
      'La contraseña debe tener al menos 6 caracteres. La contraseña debe incluir al menos un dígito.',
  });
});

it('devuelve 401 sin sesión y 403 para Empleado', async () => {
  await expect(crearUsuario(anonimo, datos)).rejects.toMatchObject({ status: 401 });
  await expect(crearUsuario(empleado, datos)).rejects.toMatchObject({ status: 403 });
});

it('conserva el detalle genérico de 500', async () => {
  servidorMock.use(variantesUsuarios.altaError500);
  await expect(crearUsuario(admin, datos)).rejects.toMatchObject({
    status: 500,
    detail: 'Ocurrió un error inesperado.',
  });
});

it('no reintenta el alta ante 502', async () => {
  let llamadas = 0;
  servidorMock.use(
    http.post(`*${alta}`, () => {
      llamadas++;
      return new HttpResponse(null, { status: 502 });
    }),
  );
  await expect(crearUsuario(admin, datos)).rejects.toMatchObject({ status: 502 });
  expect(llamadas).toBe(1);
});

it('envía pagina y tamano y devuelve el listado paginado', async () => {
  const filtro = { pagina: 2, tamano: 1 };
  const pagina = await listarUsuariosMock(admin, filtro);
  expect(pagina).toMatchObject({
    pagina: 2,
    tamanoPagina: 1,
    total: 2,
    items: [{ nombre: 'Ana', apellido: 'Gómez', rol: 'Empleado' }],
  });
  expect(usuariosKeys.lista(filtro)).toEqual(['usuarios', 'lista', filtro]);
  servidorMock.use(variantesUsuarios.usuariosVacios);
  await expect(listarUsuariosMock(admin)).resolves.toMatchObject({ total: 0, items: [] });
});

it('edita el usuario y devuelve 404 si no existe', async () => {
  const usuario = await obtenerYoMock(empleado);
  const { nombre, apellido } = usuario;
  const cambios = { nombre, apellido, rol: 'Administrador' } as const;
  await expect(actualizarUsuarioMock(admin, usuario.id, cambios)).resolves.toMatchObject(cambios);
  await expect(actualizarUsuarioMock(admin, 'inexistente', cambios)).rejects.toMatchObject({
    status: 404,
  });
});

it('cambia activo y refleja el cambio en el listado', async () => {
  const usuario = await obtenerYoMock(empleado);
  await expect(cambiarActivoUsuarioMock(admin, usuario.id, false)).resolves.toMatchObject({
    id: usuario.id,
    activo: false,
  });
  expect((await listarUsuariosMock(admin)).items).toContainEqual(
    expect.objectContaining({ id: usuario.id, activo: false }),
  );
});

it('devuelve yo para un empleado y contempla que el endpoint no exista', async () => {
  await expect(obtenerYoMock(empleado)).resolves.toMatchObject({ rol: 'Empleado', nombre: 'Ana' });
  expect(usuariosKeys.yo()).toEqual(['usuarios', 'yo']);
  servidorMock.use(variantesUsuarios.yoNoDisponible);
  await expect(obtenerYoMock(empleado)).rejects.toMatchObject({ status: 404 });
});

it('envía login por POST con el contrato de T-12', async () => {
  const body = { email: datos.email, password: datos.password };
  const respuesta = { token: 'mock-login', rol: 'Empleado', expiraEn: '2026-11-04T12:00:00Z' };
  servidorMock.use(
    http.post('*/api/auth/login', async ({ request }) => {
      expect(request.headers.get('Authorization')).toBeNull();
      expect(await request.json()).toEqual(body);
      return HttpResponse.json(respuesta);
    }),
  );
  await expect(loginRequest(anonimo, body)).resolves.toEqual(respuesta);
});
