import type { ApiBlob, ApiClient } from '../client';
import type { PaginaResponse } from '../dto/comunes';
import type {
  FacturaResponse,
  PagoCajaRequest,
  PagoListadoFiltro,
  PagoListadoResponse,
  PagoResponse,
} from '../dto/pagos';

/**
 * Claves de caché de pagos.
 * `all` invalida listas y detalles después de cobrar (US-FE-B-17, RV-27).
 */
export const pagosKeys = {
  all: ['pagos'] as const,
  detalle: (id: string) => [...pagosKeys.all, 'detalle', id] as const,
  factura: (id: string) => [...pagosKeys.all, 'factura', id] as const,
  lista: (filtro: PagoListadoFiltro = {}) => [...pagosKeys.all, 'lista', filtro] as const,
  porPoliza: (polizaId: string) => [...pagosKeys.all, 'porPoliza', polizaId] as const,
};

/**
 * `POST /api/pagos/caja`: cobra una o más cuotas en caja.
 * No reintenta (FC11): un error de red no se reenvía.
 *
 * `POST /api/pagos/{id}/conciliar` existe en el back pero queda fuera del
 * alcance del front (ficha US-FE-T-29 §16, RV-57): no se implementa acá.
 */
export function cobrarEnCaja(api: ApiClient, body: PagoCajaRequest): Promise<PagoResponse> {
  return api.post<PagoResponse>('/api/pagos/caja', body);
}

/** `GET /api/pagos/{id}`: detalle de un pago. */
export function obtenerPago(api: ApiClient, id: string): Promise<PagoResponse> {
  return api.get<PagoResponse>(`/api/pagos/${id}`);
}

/** `GET /api/pagos/{id}/factura`: factura de un pago, incluida `PENDIENTE_CAE`. */
export function obtenerFacturaDePago(api: ApiClient, id: string): Promise<FacturaResponse> {
  return api.get<FacturaResponse>(`/api/pagos/${id}/factura`);
}

/** `GET /api/pagos/{id}/factura/pdf`: PDF de la factura autorizada de un pago. */
export function obtenerPdfDeFactura(api: ApiClient, id: string): Promise<ApiBlob> {
  return api.get(`/api/pagos/${id}/factura/pdf`, { responseType: 'blob' });
}

/** `GET /api/pagos`: listado paginado de pagos, del más nuevo al más viejo, para la tabla de B-19. */
export function listarPagos(
  api: ApiClient,
  filtro: PagoListadoFiltro = {},
): Promise<PaginaResponse<PagoListadoResponse>> {
  return api.get<PaginaResponse<PagoListadoResponse>>('/api/pagos', {
    query: { ...filtro },
  });
}

/**
 * `GET /api/polizas/{id}/pagos`: pagos de una póliza para el widget de B-18.
 * Devuelve `PagoResponse[]` con `factura`, del más nuevo al más viejo (RV-D13).
 */
export function listarPagosDePoliza(api: ApiClient, polizaId: string): Promise<PagoResponse[]> {
  return api.get<PagoResponse[]>(`/api/polizas/${polizaId}/pagos`);
}
