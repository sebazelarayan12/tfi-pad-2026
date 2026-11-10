import { http, HttpResponse, type HttpHandler } from 'msw';
import type { LoginRequest, LoginResponse } from '../../src/dto/auth';
import type { PaginaResponse } from '../../src/dto/comunes';
import {
  ESTADO_GRUPO,
  type ClaveGeneradaResponse,
  type EstadoGrupo,
  type GrupoCuentaResponse,
  type GrupoListItemResponse,
  type MotivoGrupoRequest,
  type RegistroGrupoRequest,
} from '../../src/dto/grupos';
import { problemaNegocio, problemaNoEncontrado, problemaSinSesion } from '../fixtures/comunes';

const registro = '*/api/publico/grupos/registro';
const login = '*/api/publico/grupos/login';
const miCuenta = '*/api/grupos/mi-cuenta';
const lista = '*/api/grupos';
const accion = '*/api/grupos/:id/:accion';

/** Valores ficticios del grupo de prueba, sin credenciales reales. */
export const grupoMock = {
  email: 'grupo.demo@example.test',
  password: 'Grupo-Demo-Mock-1!',
  token: 'mock-grupo-demo',
};

interface GrupoMock extends GrupoListItemResponse {
  clavePrefijo: string | null;
  claveCreadaEn: string | null;
}

const ahora = () => new Date().toISOString();

function semilla(): GrupoMock[] {
  return [
    {
      id: 'g1000000-0000-0000-0000-000000000001',
      nombre: 'Estacionamiento Sur',
      email: grupoMock.email,
      contacto: 'Ana Pérez',
      descripcion: 'Consultar si un vehículo tiene seguro vigente por patente.',
      estado: ESTADO_GRUPO.Aprobada,
      motivo: null,
      fechaSolicitud: '2026-11-08T15:00:00Z',
      fechaResolucion: '2026-11-09T12:00:00Z',
      tieneClave: false,
      clavePrefijo: null,
      claveCreadaEn: null,
    },
    {
      id: 'g1000000-0000-0000-0000-000000000002',
      nombre: 'Seguros del Norte',
      email: 'norte@example.test',
      contacto: 'Beto Díaz',
      descripcion: 'Mostrar la deuda de un cliente por DNI en nuestro portal.',
      estado: ESTADO_GRUPO.Pendiente,
      motivo: null,
      fechaSolicitud: '2026-11-10T09:30:00Z',
      fechaResolucion: null,
      tieneClave: false,
      clavePrefijo: null,
      claveCreadaEn: null,
    },
  ];
}

let grupos = semilla();

/** Deja los grupos como al arrancar (para tests). */
export function reiniciarGruposMock(): void {
  grupos = semilla();
}

function claveNueva(): string {
  const alfabeto = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let resto = '';
  for (let i = 0; i < 43; i += 1) resto += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return `nxk_${resto}`;
}

function aItem(g: GrupoMock): GrupoListItemResponse {
  const { clavePrefijo: _p, claveCreadaEn: _c, ...item } = g;
  return item;
}

function aCuenta(g: GrupoMock): GrupoCuentaResponse {
  return { ...aItem(g), clavePrefijo: g.clavePrefijo, claveCreadaEn: g.claveCreadaEn };
}

function grupoDeSesion(request: Request): GrupoMock | undefined {
  if (request.headers.get('Authorization') !== `Bearer ${grupoMock.token}`) return undefined;
  return grupos.find((g) => g.email === grupoMock.email);
}

function error(request: Request, problema: { status: number }) {
  return HttpResponse.json(
    { ...problema, instance: new URL(request.url).pathname },
    { status: problema.status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

export const handlers: HttpHandler[] = [
  http.post(registro, async ({ request }) => {
    const body = (await request.json()) as RegistroGrupoRequest;
    const email = body.email.trim().toLowerCase();
    if (grupos.some((g) => g.email === email)) {
      return error(request, problemaNegocio('El email ya está registrado.'));
    }
    if (grupos.some((g) => g.nombre.toLowerCase() === body.nombre.trim().toLowerCase())) {
      return error(request, problemaNegocio('Ya existe un grupo con ese nombre.'));
    }
    const nuevo: GrupoMock = {
      id: crypto.randomUUID(),
      nombre: body.nombre.trim(),
      email,
      contacto: body.contacto.trim(),
      descripcion: body.descripcion.trim(),
      estado: ESTADO_GRUPO.Pendiente,
      motivo: null,
      fechaSolicitud: ahora(),
      fechaResolucion: null,
      tieneClave: false,
      clavePrefijo: null,
      claveCreadaEn: null,
    };
    grupos = [nuevo, ...grupos];
    return HttpResponse.json(aCuenta(nuevo), { status: 201 });
  }),

  http.post(login, async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    if (body.email !== grupoMock.email || body.password !== grupoMock.password) {
      return error(request, { ...problemaSinSesion(), status: 401 });
    }
    const respuesta: LoginResponse = {
      token: grupoMock.token,
      rol: 'Grupo',
      expiraEn: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    };
    return HttpResponse.json(respuesta);
  }),

  http.get(miCuenta, ({ request }) => {
    const grupo = grupoDeSesion(request);
    return grupo ? HttpResponse.json(aCuenta(grupo)) : error(request, problemaSinSesion());
  }),

  http.post(`${miCuenta}/clave`, ({ request }) => {
    const grupo = grupoDeSesion(request);
    if (!grupo) return error(request, problemaSinSesion());
    if (grupo.estado !== ESTADO_GRUPO.Aprobada) {
      return error(request, problemaNegocio('Tu solicitud todavía no está aprobada.'));
    }
    const clave = claveNueva();
    grupo.tieneClave = true;
    grupo.clavePrefijo = clave.slice(0, 8);
    grupo.claveCreadaEn = ahora();
    const respuesta: ClaveGeneradaResponse = {
      clave,
      prefijo: grupo.clavePrefijo,
      creadaEn: grupo.claveCreadaEn,
    };
    return HttpResponse.json(respuesta, { status: 201 });
  }),

  http.get(lista, ({ request }) => {
    const url = new URL(request.url);
    const filtro = url.searchParams.get('estado');
    const filtrados = grupos.filter((g) => filtro === null || g.estado === Number(filtro));
    const pagina: PaginaResponse<GrupoListItemResponse> = {
      items: filtrados.map(aItem),
      pagina: 1,
      tamanoPagina: 20,
      total: filtrados.length,
    };
    return HttpResponse.json(pagina);
  }),

  http.post(accion, async ({ request, params }) => {
    const grupo = grupos.find((g) => g.id === params.id);
    if (!grupo) return error(request, problemaNoEncontrado('El grupo no existe.'));

    const nombre = String(params.accion);
    let estado: EstadoGrupo;
    let motivo: string | null = null;
    if (nombre === 'aprobar') {
      estado = ESTADO_GRUPO.Aprobada;
    } else if (nombre === 'rechazar' || nombre === 'revocar') {
      estado = nombre === 'rechazar' ? ESTADO_GRUPO.Rechazada : ESTADO_GRUPO.Revocada;
      motivo = ((await request.json()) as MotivoGrupoRequest).motivo;
    } else {
      return error(request, problemaNoEncontrado('La acción no existe.'));
    }

    grupo.estado = estado;
    grupo.motivo = motivo;
    grupo.fechaResolucion = ahora();
    if (estado === ESTADO_GRUPO.Revocada) {
      grupo.tieneClave = false;
      grupo.clavePrefijo = null;
      grupo.claveCreadaEn = null;
    }
    return HttpResponse.json(aItem(grupo));
  }),
];
