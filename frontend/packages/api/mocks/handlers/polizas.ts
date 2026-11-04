import { http, HttpResponse, type HttpHandler } from 'msw';

import type { ProblemDetails } from '../../src/dto/comunes';
import {
  ESTADO_POLIZA_NUMERO,
  type CuotaResponse,
  type EmitirPolizaRequest,
  type EstadoPolizaNombre,
  type PolizaDetalleResponse,
  type PolizaListItemResponse,
} from '../../src/dto/polizas';
import {
  problemaNegocio,
  problemaNoEncontrado,
  problemaSinPermiso,
  problemaSinSesion,
  problemaValidacion,
} from '../fixtures/comunes';

/**
 * Fixtures de pólizas (FC4: datos de ejemplo del contrato §5.3).
 * No se exportan al barrel de `@nexa/api`: son solo del handler MSW.
 */
export const POLIZA_UNO_ID = 'd1000000-0000-0000-0000-000000000001';
export const POLIZA_DOS_ID = 'd1000000-0000-0000-0000-000000000002';
const CLIENTE_UNO_ID = 'c1000000-0000-0000-0000-000000000001';
const CLIENTE_DOS_ID = 'c1000000-0000-0000-0000-000000000002';

/** DNI de fixture por cliente: el back real todavía no resuelve `dni` (PB-06). */
const DNI_POR_CLIENTE: Record<string, string> = {
  [CLIENTE_UNO_ID]: '30123456',
  [CLIENTE_DOS_ID]: '45123456',
};

const POLIZAS: PolizaListItemResponse[] = [
  {
    id: POLIZA_UNO_ID,
    numero: 'POL-0000001',
    clienteId: CLIENTE_UNO_ID,
    patente: 'AB123CD',
    codigoPlan: 'RC',
    primaMensual: 12000,
    fechaInicio: '2026-11-01',
    fechaFin: '2027-05-01',
    estado: ESTADO_POLIZA_NUMERO.Vigente,
  },
  {
    id: POLIZA_DOS_ID,
    numero: 'POL-0000002',
    clienteId: CLIENTE_DOS_ID,
    patente: 'AC456DE',
    codigoPlan: 'TC',
    primaMensual: 18000,
    fechaInicio: '2026-10-15',
    fechaFin: '2027-04-15',
    estado: ESTADO_POLIZA_NUMERO.Pendiente,
  },
];

const CUOTAS_POLIZA_UNO: CuotaResponse[] = [
  {
    id: 'f1000000-0000-0000-0000-000000000001',
    numero: 1,
    importe: 12000,
    recargo: 0,
    fechaVencimiento: '2026-12-10',
    estado: 2,
    fechaPago: '2026-12-03T13:10:00',
  },
  {
    id: 'f1000000-0000-0000-0000-000000000002',
    numero: 2,
    importe: 12000,
    recargo: 0,
    fechaVencimiento: '2027-01-10',
    estado: 0,
    fechaPago: null,
  },
  {
    id: 'f1000000-0000-0000-0000-000000000003',
    numero: 3,
    importe: 12000,
    recargo: 0,
    fechaVencimiento: '2027-02-10',
    estado: 0,
    fechaPago: null,
  },
  {
    id: 'f1000000-0000-0000-0000-000000000004',
    numero: 4,
    importe: 12000,
    recargo: 0,
    fechaVencimiento: '2027-03-10',
    estado: 0,
    fechaPago: null,
  },
  {
    id: 'f1000000-0000-0000-0000-000000000005',
    numero: 5,
    importe: 12000,
    recargo: 0,
    fechaVencimiento: '2027-04-10',
    estado: 0,
    fechaPago: null,
  },
  {
    id: 'f1000000-0000-0000-0000-000000000006',
    numero: 6,
    importe: 12000,
    recargo: 0,
    fechaVencimiento: '2027-05-10',
    estado: 0,
    fechaPago: null,
  },
];

const POLIZA_UNO_DETALLE: PolizaDetalleResponse = {
  id: POLIZA_UNO_ID,
  numero: 'POL-0000001',
  clienteId: CLIENTE_UNO_ID,
  vehiculoId: 'b1000000-0000-0000-0000-000000000001',
  patente: 'AB123CD',
  marca: 'Toyota',
  modelo: 'Corolla XEi',
  planId: 'a1000000-0000-0000-0000-000000000001',
  codigoPlan: 'RC',
  nombrePlan: 'Responsabilidad civil',
  cotizacionId: 'e1000000-0000-0000-0000-000000000001',
  primaMensual: 12000,
  vigenciaMeses: 6,
  fechaEmision: '2026-11-01T14:03:00',
  fechaInicio: '2026-11-01',
  fechaFin: '2027-05-01',
  estado: ESTADO_POLIZA_NUMERO.Vigente,
  cuotas: CUOTAS_POLIZA_UNO,
};

const POLIZA_CANCELADA: PolizaDetalleResponse = {
  ...POLIZA_UNO_DETALLE,
  estado: ESTADO_POLIZA_NUMERO.Cancelada,
  cuotas: CUOTAS_POLIZA_UNO.map((cuota) => ({
    ...cuota,
    estado: cuota.estado === 2 ? 2 : 3,
    fechaPago: cuota.estado === 2 ? cuota.fechaPago : null,
  })),
};

const PAGINA_MAXIMA = Math.floor(2147483647 / 100);
const TAMANO_MAXIMO = 100;

interface FiltroLeido {
  estado?: EstadoPolizaNombre;
  clienteId?: string;
  patente?: string;
  numero?: string;
  dni?: string;
  planCodigo?: string;
  pagina: number;
  tamano: number;
  errors: Record<string, string[]>;
}

function autorizado(request: Request): boolean {
  return request.headers.get('Authorization')?.startsWith('Bearer ') ?? false;
}

function problema(status: number, body: ProblemDetails): Response {
  return HttpResponse.json(body, {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

function paginaDe<T>(items: T[], pagina: number, tamano: number) {
  const inicio = (pagina - 1) * tamano;
  return {
    items: items.slice(inicio, inicio + tamano),
    pagina,
    tamanoPagina: tamano,
    total: items.length,
  };
}

function leerEntero(valor: string | null, porDefecto: number): number | null {
  if (valor === null) return porDefecto;
  const numero = Number(valor);
  return Number.isInteger(numero) ? numero : null;
}

function leerFiltro(url: URL): FiltroLeido {
  const errors: Record<string, string[]> = {};
  const estado = url.searchParams.get('estado');
  if (estado !== null && !Object.prototype.hasOwnProperty.call(ESTADO_POLIZA_NUMERO, estado)) {
    errors.Estado = [`The value '${estado}' is not valid.`];
  }

  const pagina = leerEntero(url.searchParams.get('pagina'), 1);
  if (pagina === null || pagina < 1 || pagina > PAGINA_MAXIMA) {
    errors.Pagina = [`The field Pagina must be between 1 and ${PAGINA_MAXIMA}.`];
  }

  const tamano = leerEntero(url.searchParams.get('tamano'), 20);
  if (tamano === null || tamano < 1 || tamano > TAMANO_MAXIMO) {
    errors.Tamano = [`The field Tamano must be between 1 and ${TAMANO_MAXIMO}.`];
  }

  return {
    ...(estado === null ? {} : { estado: estado as EstadoPolizaNombre }),
    ...(url.searchParams.get('clienteId') === null
      ? {}
      : { clienteId: url.searchParams.get('clienteId') ?? undefined }),
    ...(url.searchParams.get('patente') === null
      ? {}
      : { patente: url.searchParams.get('patente') ?? undefined }),
    ...(url.searchParams.get('numero') === null
      ? {}
      : { numero: url.searchParams.get('numero') ?? undefined }),
    ...(url.searchParams.get('dni') === null
      ? {}
      : { dni: url.searchParams.get('dni') ?? undefined }),
    ...(url.searchParams.get('planCodigo') === null
      ? {}
      : { planCodigo: url.searchParams.get('planCodigo') ?? undefined }),
    pagina: pagina ?? 1,
    tamano: tamano ?? 20,
    errors,
  };
}

function filtrarPolizas(filtro: FiltroLeido): PolizaListItemResponse[] {
  const estadoNumero =
    filtro.estado === undefined ? undefined : ESTADO_POLIZA_NUMERO[filtro.estado];
  const planCodigo = filtro.planCodigo?.trim().toUpperCase();
  const digitosNumero = filtro.numero?.replace(/\D/g, '');

  return POLIZAS.filter((poliza) => {
    if (estadoNumero !== undefined && poliza.estado !== estadoNumero) return false;
    if (filtro.clienteId && poliza.clienteId !== filtro.clienteId) return false;
    if (filtro.patente && poliza.patente !== filtro.patente) return false;
    if (planCodigo && poliza.codigoPlan.toUpperCase() !== planCodigo) return false;
    if (filtro.dni && DNI_POR_CLIENTE[poliza.clienteId] !== filtro.dni) return false;
    if (digitosNumero && !poliza.numero.replace(/\D/g, '').includes(digitosNumero)) return false;
    return true;
  });
}

function motivoDe(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('motivo' in body)) return null;
  const motivo = (body as { motivo: unknown }).motivo;
  return typeof motivo === 'string' ? motivo.trim() : null;
}

function detalleDeCotizacion(body: unknown): string {
  if (typeof body !== 'object' || body === null || !('cotizacionId' in body)) {
    return 'la cotización indicada';
  }
  const cotizacionId = (body as { cotizacionId: unknown }).cotizacionId;
  return typeof cotizacionId === 'string' ? cotizacionId : 'la cotización indicada';
}

function polizaNoExisteResponse(id: string): Response {
  return problema(404, problemaNoEncontrado(`La póliza ${id} no existe.`));
}

function idDePoliza(request: Request): string {
  return new URL(request.url).pathname.split('/')[3] ?? 'desconocida';
}

/**
 * Handlers de éxito por defecto de `GET/POST /api/polizas` y sus subrutas.
 *
 * ADVERTENCIA (PB-06, §14): el back real ignora `numero`, `dni` y `planCodigo`
 * porque no están en `PolizaFiltro`. Responde 200 con las pólizas que pasan los
 * filtros reales, sin error. Si una pantalla se monta contra el back real, muestra
 * resultados que no corresponden al término buscado. Mitigación: B-14 y el filtro
 * de plan de B-13 se ocultan hasta PB-06; esta búsqueda solo vive en MSW.
 */
export const handlers: HttpHandler[] = [
  http.post('*/api/polizas', async ({ request }) => {
    if (!autorizado(request)) return problema(401, problemaSinSesion());
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problema(400, problemaValidacion({ $: ['The JSON value could not be converted.'] }));
    }
    if (typeof body !== 'object' || body === null) {
      return problema(400, problemaValidacion({ $: ['The request body is required.'] }));
    }
    const solicitud = body as Partial<EmitirPolizaRequest>;
    if (typeof solicitud.cotizacionId !== 'string') {
      return problema(
        400,
        problemaValidacion({ CotizacionId: ['The CotizacionId field is required.'] }),
      );
    }
    return HttpResponse.json(POLIZA_UNO_DETALLE, { status: 201 });
  }),

  http.get('*/api/polizas', ({ request }) => {
    if (!autorizado(request)) return problema(401, problemaSinSesion());
    const filtro = leerFiltro(new URL(request.url));
    if (Object.keys(filtro.errors).length > 0) {
      return problema(400, problemaValidacion(filtro.errors));
    }
    return HttpResponse.json(paginaDe(filtrarPolizas(filtro), filtro.pagina, filtro.tamano));
  }),

  http.get('*/api/polizas/:id/cuotas', ({ request, params }) => {
    if (!autorizado(request)) return problema(401, problemaSinSesion());
    const id = String(params.id);
    if (id !== POLIZA_UNO_ID) return polizaNoExisteResponse(id);
    return HttpResponse.json(CUOTAS_POLIZA_UNO);
  }),

  http.get('*/api/polizas/:id', ({ request, params }) => {
    if (!autorizado(request)) return problema(401, problemaSinSesion());
    const id = String(params.id);
    if (id !== POLIZA_UNO_ID) return polizaNoExisteResponse(id);
    return HttpResponse.json(POLIZA_UNO_DETALLE);
  }),

  http.post('*/api/polizas/:id/cancelar', async ({ request, params }) => {
    if (!autorizado(request)) return problema(401, problemaSinSesion());
    const id = String(params.id);
    if (id !== POLIZA_UNO_ID) return polizaNoExisteResponse(id);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problema(400, problemaValidacion({ Motivo: ['The Motivo field is required.'] }));
    }
    const motivo = motivoDe(body);
    if (motivo === null || motivo.length === 0 || motivo.length > 200) {
      return problema(400, problemaValidacion({ Motivo: ['The Motivo field is required.'] }));
    }
    return HttpResponse.json(POLIZA_CANCELADA);
  }),
];

/** Variante: `GET /api/polizas` responde 400 de validación. */
export const polizasFiltroInvalido: HttpHandler = http.get('*/api/polizas', () =>
  problema(400, problemaValidacion({ Estado: ['The value is not valid.'] })),
);

/** Variante: cualquier ruta de pólizas responde 401 sin token. */
export const sinToken: HttpHandler = http.all('*/api/polizas*', () =>
  problema(401, problemaSinSesion()),
);

/** Variante: `GET /api/polizas/{id}` y `POST /api/polizas/{id}/cancelar` responden 404. */
export const polizaNoExiste: HttpHandler = http.all(
  /\/api\/polizas\/[^/]+(?:\/cancelar)?$/,
  ({ request }) => polizaNoExisteResponse(idDePoliza(request)),
);

/** Variante: `GET /api/polizas/{id}/cuotas` responde 404. */
export const cuotasPolizaNoExiste: HttpHandler = http.get(
  '*/api/polizas/:id/cuotas',
  ({ params }) => polizaNoExisteResponse(String(params.id)),
);

/** Variante: `POST /api/polizas/{id}/cancelar` responde 400 por transición inválida. */
export const cancelarEstadoInvalido: HttpHandler = http.post('*/api/polizas/:id/cancelar', () =>
  problema(400, problemaNegocio('No se puede pasar una póliza de Vencida a Cancelada.')),
);

/** Variante: `POST /api/polizas/{id}/cancelar` responde 400 de validación de `Motivo`. */
export const cancelarMotivoVacio: HttpHandler = http.post('*/api/polizas/:id/cancelar', () =>
  problema(400, problemaValidacion({ Motivo: ['The Motivo field is required.'] })),
);

/** Variante: la búsqueda mock (PB-06) no encuentra resultados. */
export const busquedaSinResultados: HttpHandler = http.get('*/api/polizas', () =>
  HttpResponse.json({ items: [], pagina: 1, tamanoPagina: 20, total: 0 }),
);

/** Variante: `POST /api/polizas` responde 404 porque la cotización no existe. */
export const emitirCotizacionNoExiste: HttpHandler = http.post(
  '*/api/polizas',
  async ({ request }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = null;
    }
    return problema(
      404,
      problemaNoEncontrado(`La cotización ${detalleDeCotizacion(body)} no existe.`),
    );
  },
);

/** Variante: `POST /api/polizas` responde 400 de negocio con el `detail` indicado. */
export function emitirErrorNegocio(detail: string): HttpHandler {
  return http.post('*/api/polizas', () => problema(400, problemaNegocio(detail)));
}

/** Variante: `POST /api/polizas` responde 400 de validación del framework. */
export const emitirValidacion: HttpHandler = http.post('*/api/polizas', () =>
  problema(400, problemaValidacion({ CotizacionId: ['The CotizacionId field is required.'] })),
);

/** Variante: `POST /api/polizas` responde 403 con rol no autorizado. */
export const emitirSinPermiso: HttpHandler = http.post('*/api/polizas', () =>
  problema(403, problemaSinPermiso()),
);

/** Variante: `POST /api/polizas` responde 502 para comprobar que no se reintenta. */
export const emitirErrorRed: HttpHandler = http.post('*/api/polizas', () =>
  problema(502, {
    status: 502,
    title: 'Bad Gateway',
    detail: 'El servicio externo no está disponible.',
    instance: '/api/polizas',
    traceId: '00-00000000000000000000000000000001-0000000000000001-01',
  }),
);
