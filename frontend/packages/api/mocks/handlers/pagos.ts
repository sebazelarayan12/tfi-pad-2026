import { http, HttpResponse, type HttpHandler } from 'msw';

import type { PaginaResponse, ProblemDetails } from '../../src/dto/comunes';
import type {
  FacturaConPdfMock,
  FacturaResponse,
  PagoListadoResponse,
  PagoResponse,
} from '../../src/dto/pagos';
import {
  problemaNegocio,
  problemaNoEncontrado,
  problemaSinPermiso,
  problemaSinSesion,
  problemaValidacion,
} from '../fixtures/comunes';
import { POLIZA_UNO_ID } from './polizas';

/**
 * Fixtures de pagos y facturas (FC4: datos de ejemplo del contrato §10.1).
 * No se exportan al barrel de `@nexa/api`: son solo del handler MSW.
 */
export const PAGO_UNO_ID = '5b0c1f2e-8a3d-4f6b-9c21-7e4d2a1b0c99';
const PAGO_DOS_ID = '5b0c1f2e-8a3d-4f6b-9c21-7e4d2a1b0c98';
const FACTURA_UNO_ID = '0e9d8c7b-6a5f-4e3d-8c2b-1a0f9e8d7c6b';
const CLIENTE_UNO_ID = 'c1000000-0000-0000-0000-000000000001';

const FACTURA_AUTORIZADA: FacturaResponse = {
  id: FACTURA_UNO_ID,
  pagoId: PAGO_UNO_ID,
  numero: '0001-00000123',
  tipo: 'B',
  importe: 51250,
  estado: 'AUTORIZADA',
  cae: '74123456789012',
  vencimientoCae: '2026-11-18',
  fechaEmision: '2026-10-30T20:00:00Z',
};

const FACTURA_PENDIENTE_CAE: FacturaResponse = {
  id: FACTURA_UNO_ID,
  pagoId: PAGO_UNO_ID,
  numero: '',
  tipo: 'B',
  importe: 51250,
  estado: 'PENDIENTE_CAE',
  cae: null,
  vencimientoCae: null,
  fechaEmision: '2026-10-30T20:00:00Z',
};

const PAGO_APROBADO: PagoResponse = {
  id: PAGO_UNO_ID,
  clienteId: CLIENTE_UNO_ID,
  numero: 'PAG-6f1c2a',
  estado: 'APROBADO',
  medio: 'CAJA',
  importe: 51250,
  fechaCreacion: '2026-10-30T20:00:00Z',
  fechaAcreditacion: '2026-10-30T20:00:00Z',
  factura: FACTURA_AUTORIZADA,
};

const PAGO_CON_FACTURA_PENDIENTE: PagoResponse = {
  ...PAGO_APROBADO,
  factura: FACTURA_PENDIENTE_CAE,
};

const PAGO_RECHAZADO: PagoResponse = {
  id: PAGO_DOS_ID,
  clienteId: CLIENTE_UNO_ID,
  numero: 'PAG-7a2b3c',
  estado: 'RECHAZADO',
  medio: 'PASARELA',
  importe: 12000,
  fechaCreacion: '2026-10-29T15:10:00Z',
  fechaAcreditacion: null,
  factura: null,
};

const PAGOS_LISTADO: PagoListadoResponse[] = [
  {
    id: PAGO_UNO_ID,
    numero: 'PAG-6f1c2a',
    fechaCreacion: '2026-10-30T20:00:00Z',
    clienteNombre: 'Juan Carlos Pérez',
    numeroPoliza: 'POL-0000001',
    cuotas: [1],
    medio: 'CAJA',
    importe: 51250,
    estado: 'APROBADO',
    factura: { numero: '0001-00000123', estado: 'AUTORIZADA' },
  },
  {
    id: PAGO_DOS_ID,
    numero: 'PAG-7a2b3c',
    fechaCreacion: '2026-10-29T15:10:00Z',
    clienteNombre: 'Juan Carlos Pérez',
    numeroPoliza: 'POL-0000001',
    cuotas: [2],
    medio: 'PASARELA',
    importe: 12000,
    estado: 'RECHAZADO',
    factura: null,
  },
];

const FACTURA_CON_PDF: FacturaConPdfMock = {
  ...FACTURA_AUTORIZADA,
  urlPdf: 'https://facturas.nexa.example/pagos/PAG-6f1c2a.pdf',
};

const FACTURA_PENDIENTE_CON_PDF: FacturaConPdfMock = {
  ...FACTURA_PENDIENTE_CAE,
  urlPdf: null,
};

function autorizado(request: Request): boolean {
  return request.headers.get('Authorization')?.startsWith('Bearer ') ?? false;
}

function problema(status: number, body: ProblemDetails): Response {
  return HttpResponse.json(body, {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

function paginaDe<T>(items: T[], pagina: number, tamano: number): PaginaResponse<T> {
  const inicio = (pagina - 1) * tamano;
  return {
    items: items.slice(inicio, inicio + tamano),
    pagina,
    tamanoPagina: tamano,
    total: items.length,
  };
}

function leerEntero(valor: string | null, porDefecto: number): number {
  if (valor === null) return porDefecto;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 1 ? numero : porDefecto;
}

function leerFiltro(url: URL): { items: PagoListadoResponse[]; pagina: number; tamano: number } {
  const estado = url.searchParams.get('estado');
  const medio = url.searchParams.get('medio');
  const numeroPoliza = url.searchParams.get('numeroPoliza');
  const pagina = leerEntero(url.searchParams.get('pagina'), 1);
  const tamano = Math.min(leerEntero(url.searchParams.get('tamano'), 20), 100);

  return {
    items: PAGOS_LISTADO.filter((pago) => {
      if (estado !== null && pago.estado !== estado) return false;
      if (medio !== null && pago.medio !== medio) return false;
      if (numeroPoliza !== null && pago.numeroPoliza !== numeroPoliza) return false;
      return true;
    }),
    pagina,
    tamano,
  };
}

async function leerCuotaIds(request: Request): Promise<string[] | null> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return null;
  }
  if (typeof body !== 'object' || body === null || !('cuotaIds' in body)) return null;
  const cuotaIds = (body as { cuotaIds: unknown }).cuotaIds;
  if (!Array.isArray(cuotaIds) || cuotaIds.length === 0) return null;
  if (!cuotaIds.every((id) => typeof id === 'string')) return null;
  return cuotaIds;
}

function pagoNoExisteResponse(): Response {
  return problema(404, problemaNoEncontrado('El pago no existe.'));
}

function facturaNoExisteResponse(): Response {
  return problema(404, problemaNoEncontrado('No se encontró la factura del pago.'));
}

/**
 * Handlers de `POST /api/pagos/caja`, `GET /api/pagos/{id}`,
 * `GET /api/pagos/{id}/factura` y los listados de pagos.
 *
 * Los tres endpoints reales usan `Politicas.Empleado`; sin token devuelven 401.
 * Con `VITE_USE_MOCKS=true` estos handlers reemplazan al back; con el back real no se usan.
 */
export const handlers: HttpHandler[] = [
  http.post('*/api/pagos/caja', async ({ request }) => {
    if (!autorizado(request)) return problema(401, problemaSinSesion());
    const cuotaIds = await leerCuotaIds(request);
    if (cuotaIds === null) {
      return problema(400, problemaValidacion({ CuotaIds: ['Debe indicar al menos una cuota.'] }));
    }
    return HttpResponse.json(PAGO_APROBADO, { status: 201 });
  }),

  http.get('*/api/pagos/:id/factura', ({ request, params }) => {
    if (!autorizado(request)) return problema(401, problemaSinSesion());
    if (String(params.id) !== PAGO_UNO_ID) return facturaNoExisteResponse();
    return HttpResponse.json(FACTURA_AUTORIZADA);
  }),

  http.get('*/api/pagos/:id', ({ request, params }) => {
    if (!autorizado(request)) return problema(401, problemaSinSesion());
    if (String(params.id) !== PAGO_UNO_ID) return pagoNoExisteResponse();
    return HttpResponse.json(PAGO_APROBADO);
  }),

  http.get('*/api/pagos', ({ request }) => {
    if (!autorizado(request)) return problema(401, problemaSinSesion());
    const filtro = leerFiltro(new URL(request.url));
    return HttpResponse.json(paginaDe(filtro.items, filtro.pagina, filtro.tamano));
  }),

  http.get('*/api/polizas/:id/pagos', ({ request, params }) => {
    if (!autorizado(request)) return problema(401, problemaSinSesion());
    const id = String(params.id);
    if (id !== POLIZA_UNO_ID) {
      return problema(404, problemaNoEncontrado(`La póliza ${id} no existe.`));
    }
    return HttpResponse.json([PAGO_APROBADO, PAGO_RECHAZADO]);
  }),
];

/** Variante: `POST /api/pagos/caja` responde 400 de validación (`cuotaIds` vacío). */
export const cajaCuotaIdsVacio: HttpHandler = http.post('*/api/pagos/caja', () =>
  problema(400, problemaValidacion({ CuotaIds: ['Debe indicar al menos una cuota.'] })),
);

/** Variante: `POST /api/pagos/caja` responde 400 por IDs repetidos. */
export const cajaCuotasRepetidas: HttpHandler = http.post('*/api/pagos/caja', () =>
  problema(400, problemaNegocio('Las cuotas no pueden repetirse.')),
);

/** Variante: `POST /api/pagos/caja` responde 404 porque alguna cuota no existe. */
export const cajaCuotaNoExiste: HttpHandler = http.post('*/api/pagos/caja', () =>
  problema(404, problemaNoEncontrado('Alguna de las cuotas indicadas no existe.')),
);

/** Variante: `POST /api/pagos/caja` responde 400 porque una cuota no es pagable (RN11). */
export const cajaCuotaNoPagable: HttpHandler = http.post('*/api/pagos/caja', () =>
  problema(400, problemaNegocio('Solo se pueden pagar cuotas pendientes o vencidas (RN11).')),
);

/** Variante: `POST /api/pagos/caja` responde 404 porque la póliza de una cuota no existe. */
export const cajaPolizaNoExiste: HttpHandler = http.post('*/api/pagos/caja', () =>
  problema(404, problemaNoEncontrado('Alguna de las pólizas indicadas no existe.')),
);

/** Variante: `POST /api/pagos/caja` responde 400 porque las cuotas son de dos clientes. */
export const cajaClientesDistintos: HttpHandler = http.post('*/api/pagos/caja', () =>
  problema(400, problemaNegocio('Todas las cuotas deben pertenecer al mismo cliente.')),
);

/** Variante: `POST /api/pagos/caja` responde 400 por conflicto de RowVersion. */
export const cajaConflictoConcurrencia: HttpHandler = http.post('*/api/pagos/caja', () =>
  problema(
    400,
    problemaNegocio('El pago o sus cuotas fueron modificados por otro cobro. Recargue los datos.'),
  ),
);

/** Variante: `POST /api/pagos/caja` responde 401 sin token. */
export const cajaSinSesion: HttpHandler = http.post('*/api/pagos/caja', () =>
  problema(401, problemaSinSesion()),
);

/** Variante: `POST /api/pagos/caja` responde 403 con rol no autorizado. */
export const cajaSinPermiso: HttpHandler = http.post('*/api/pagos/caja', () =>
  problema(403, problemaSinPermiso()),
);

/** Variante: `POST /api/pagos/caja` responde 502 para comprobar que no se reintenta. */
export const cajaErrorRed: HttpHandler = http.post('*/api/pagos/caja', () =>
  problema(502, {
    status: 502,
    title: 'Bad Gateway',
    detail: 'El servicio externo no está disponible.',
    instance: '/api/pagos/caja',
    traceId: '00-00000000000000000000000000000001-0000000000000001-01',
  }),
);

/** Variante: el cobro queda aprobado pero la factura queda `PENDIENTE_CAE` (201, no error). */
export const cajaFacturaPendienteCae: HttpHandler = http.post('*/api/pagos/caja', () =>
  HttpResponse.json(PAGO_CON_FACTURA_PENDIENTE, { status: 201 }),
);

/** Variante: `GET /api/pagos/{id}` responde 404. */
export const pagoNoExiste: HttpHandler = http.get('*/api/pagos/:id', pagoNoExisteResponse);

/** Variante: `GET /api/pagos/{id}/factura` devuelve `PENDIENTE_CAE` con `urlPdf: null` (PB-11). */
export const facturaPendienteCae: HttpHandler = http.get('*/api/pagos/:id/factura', () =>
  HttpResponse.json(FACTURA_PENDIENTE_CON_PDF),
);

/** Variante: `GET /api/pagos/{id}/factura` responde 404. */
export const facturaNoExiste: HttpHandler = http.get(
  '*/api/pagos/:id/factura',
  facturaNoExisteResponse,
);

/** Variante: `GET /api/pagos/{id}/factura` devuelve `urlPdf` de prueba (PB-11). */
export const facturaConPdf: HttpHandler = http.get('*/api/pagos/:id/factura', () =>
  HttpResponse.json(FACTURA_CON_PDF),
);

/** Variante: el listado de pagos (PB-05) no tiene resultados. */
export const pagosVacios: HttpHandler = http.get('*/api/pagos', () =>
  HttpResponse.json({ items: [], pagina: 1, tamanoPagina: 20, total: 0 }),
);

/** Variante: cualquier ruta de pagos responde 401 sin token. */
export const pagosSinToken: HttpHandler = http.all(
  /\/api\/(?:pagos|polizas\/[^/]+\/pagos)(?:\/.*)?$/,
  () => problema(401, problemaSinSesion()),
);
