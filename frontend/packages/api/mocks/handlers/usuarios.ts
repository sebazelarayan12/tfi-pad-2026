import { http, HttpResponse } from 'msw';
import type { PaginaResponse, ProblemDetails } from '../../src/dto/comunes';
import type {
  ActualizarUsuarioMock,
  CrearUsuarioRequest,
  UsuarioListItemMock,
  UsuarioResponse,
  YoResponseMock,
} from '../../src/dto/usuarios';
import {
  problemaErrorInesperado,
  problemaNegocio,
  problemaNoEncontrado,
  problemaSinPermiso,
  problemaSinSesion,
  problemaValidacion,
} from '../fixtures/comunes';

const alta = '*/api/auth/usuarios';
const lista = '*/api/usuarios';
const yo = '*/api/auth/yo';

// Valores ficticios para seleccionar el rol en MSW, sin credenciales reales.
export const tokensMockUsuarios = {
  administrador: 'mock-usuarios-admin',
  empleado: 'mock-usuarios-empleado',
};

const semillas: readonly UsuarioListItemMock[] = [
  {
    id: 'a2000000-0000-0000-0000-000000000001',
    email: 'admin@example.test',
    nombre: 'Ana',
    apellido: 'Gómez',
    rol: 'Administrador',
    activo: true,
    ultimoIngreso: null,
  },
  {
    id: 'a2000000-0000-0000-0000-000000000002',
    email: 'empleado@example.test',
    nombre: 'Ana',
    apellido: 'Gómez',
    rol: 'Empleado',
    activo: true,
    ultimoIngreso: null,
  },
];

function error(request: Request, problema: ProblemDetails) {
  return HttpResponse.json(
    { ...problema, instance: new URL(request.url).pathname },
    { status: problema.status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

function sesion(request: Request, usuarios: UsuarioListItemMock[]) {
  const auth = request.headers.get('Authorization');
  if (auth === `Bearer ${tokensMockUsuarios.administrador}`) return usuarios[0];
  if (auth === `Bearer ${tokensMockUsuarios.empleado}`) return usuarios[1];
  return undefined;
}

function usuarioNoExiste(request: Request) {
  return error(request, problemaNoEncontrado('El usuario no existe.'));
}

function validarAlta(body: CrearUsuarioRequest) {
  const errors: Record<string, string[]> = {};
  const { email, password, rol, nombre, apellido } = body;
  if (!email?.trim()) errors.Email = ['El email es obligatorio.'];
  else if (!/^[^@\s]+@[^@\s]+$/.test(email))
    errors.Email = ['El email no tiene un formato válido.'];
  else if (email.length > 256) errors.Email = ['El email no puede superar los 256 caracteres.'];
  if (!password?.trim()) errors.Password = ['La contraseña es obligatoria.'];
  if (!rol) errors.Rol = ['El rol es obligatorio.'];
  else if (rol !== 'Administrador' && rol !== 'Empleado') {
    errors.Rol = ['El rol debe ser Administrador o Empleado.'];
  }
  if (!nombre?.trim()) errors.Nombre = ['El nombre es obligatorio.'];
  else if (nombre.length > 100) errors.Nombre = ['El nombre no puede superar los 100 caracteres.'];
  if (!apellido?.trim()) errors.Apellido = ['El apellido es obligatorio.'];
  else if (apellido.length > 100)
    errors.Apellido = ['El apellido no puede superar los 100 caracteres.'];
  return Object.keys(errors).length ? problemaValidacion(errors) : null;
}

function paginar(
  request: Request,
  usuarios: UsuarioListItemMock[],
): PaginaResponse<UsuarioListItemMock> {
  const query = new URL(request.url).searchParams;
  const enteroPositivo = (valor: string | null, defaultValue: number) => {
    const numero = Number(valor);
    return Number.isSafeInteger(numero) && numero > 0 ? numero : defaultValue;
  };
  const pagina = enteroPositivo(query.get('pagina'), 1);
  const tamanoPagina = Math.min(enteroPositivo(query.get('tamano'), 20), 100);
  const inicio = (pagina - 1) * tamanoPagina;
  return {
    pagina,
    tamanoPagina,
    total: usuarios.length,
    items: usuarios.slice(inicio, inicio + tamanoPagina),
  };
}

export function crearHandlersUsuarios() {
  const usuarios = semillas.map((usuario) => ({ ...usuario }));
  const buscar = (id: string) => usuarios.find((usuario) => usuario.id === id);
  function exigirAdmin(request: Request) {
    const usuario = sesion(request, usuarios);
    if (!usuario?.activo) return error(request, problemaSinSesion());
    return usuario.rol === 'Administrador' ? null : error(request, problemaSinPermiso());
  }

  return [
    http.post(alta, async ({ request }) => {
      const permiso = exigirAdmin(request);
      if (permiso) return permiso;
      const body = (await request.json()) as CrearUsuarioRequest;
      const validacion = validarAlta(body);
      if (validacion) return error(request, validacion);
      if (usuarios.some((usuario) => usuario.email.toLowerCase() === body.email.toLowerCase())) {
        return error(request, problemaNegocio('El email ya está registrado.'));
      }
      const { email, rol, nombre, apellido } = body;
      const creado = { id: crypto.randomUUID(), email, rol };
      usuarios.push({ ...creado, nombre, apellido, activo: true, ultimoIngreso: null });
      return HttpResponse.json<UsuarioResponse>(creado, { status: 201 });
    }),
    http.get(
      lista,
      ({ request }) => exigirAdmin(request) ?? HttpResponse.json(paginar(request, usuarios)),
    ),
    http.put(`${lista}/:id`, async ({ request, params }) => {
      const permiso = exigirAdmin(request);
      if (permiso) return permiso;
      const usuario = buscar(String(params.id));
      if (!usuario) return usuarioNoExiste(request);
      const { nombre, apellido, rol } = (await request.json()) as ActualizarUsuarioMock;
      Object.assign(usuario, { nombre, apellido, rol });
      return HttpResponse.json(usuario);
    }),
    http.patch(`${lista}/:id/activo`, async ({ request, params }) => {
      const permiso = exigirAdmin(request);
      if (permiso) return permiso;
      const usuario = buscar(String(params.id));
      if (!usuario) return usuarioNoExiste(request);
      const { activo } = (await request.json()) as { activo: unknown };
      if (typeof activo !== 'boolean') {
        return error(request, problemaValidacion({ Activo: ['Debe ser booleano.'] }));
      }
      usuario.activo = activo;
      return HttpResponse.json(usuario);
    }),
    http.get(yo, ({ request }) => {
      const usuario = sesion(request, usuarios);
      if (!usuario?.activo) return error(request, problemaSinSesion());
      const { id, email, nombre, apellido, rol } = usuario;
      return HttpResponse.json<YoResponseMock>({ id, email, nombre, apellido, rol });
    }),
  ];
}

export const handlers = crearHandlersUsuarios();

export const variantesUsuarios = {
  // Simula el detalle existente de Identity sin implementar su política de contraseña en el cliente.
  contrasenaRechazada: http.post(alta, ({ request }) =>
    error(
      request,
      problemaNegocio(
        'La contraseña debe tener al menos 6 caracteres. La contraseña debe incluir al menos un dígito.',
      ),
    ),
  ),
  altaError500: http.post(alta, ({ request }) => error(request, problemaErrorInesperado())),
  usuariosVacios: http.get(lista, ({ request }) => HttpResponse.json(paginar(request, []))),
  yoNoDisponible: http.get(yo, ({ request }) =>
    error(request, problemaNoEncontrado('El endpoint no está disponible.')),
  ),
};
