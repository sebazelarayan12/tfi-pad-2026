import type { ApiClient } from '../client';
import type { PaginaResponse } from '../dto/comunes';
import type {
  CancelarPolizaRequest,
  CuotaResponse,
  EmitirPolizaRequest,
  PolizaBusquedaMock,
  PolizaDetalleResponse,
  PolizaFiltroQuery,
  PolizaListItemResponse,
} from '../dto/polizas';

/**
 * Claves de caché de pólizas.
 * `all` invalida listas y detalles después de emitir o cancelar (US-FE-T-28 §7.1 y §7.5).
 */
export const polizasKeys = {
  all: ['polizas'] as const,
  lista: (filtro: PolizaBusquedaMock = {}) => [...polizasKeys.all, 'lista', filtro] as const,
  detalle: (id: string) => [...polizasKeys.all, 'detalle', id] as const,
  cuotas: (id: string) => [...polizasKeys.all, 'cuotas', id] as const,
};

/**
 * `POST /api/polizas`: emite una póliza desde una cotización.
 * No reintenta (FC11): un error de red no se reenvía.
 */
export function emitirPoliza(
  api: ApiClient,
  body: EmitirPolizaRequest,
): Promise<PolizaDetalleResponse> {
  return api.post<PolizaDetalleResponse>('/api/polizas', body);
}

/** `GET /api/polizas`: listado paginado, ordenado por `fechaEmision` y `numero` descendentes. */
export function listarPolizas(
  api: ApiClient,
  filtro: PolizaFiltroQuery = {},
): Promise<PaginaResponse<PolizaListItemResponse>> {
  return api.get<PaginaResponse<PolizaListItemResponse>>('/api/polizas', {
    query: { ...filtro },
  });
}

/** `GET /api/polizas/{id}`: detalle con sus cuotas. */
export function obtenerPoliza(api: ApiClient, id: string): Promise<PolizaDetalleResponse> {
  return api.get<PolizaDetalleResponse>(`/api/polizas/${id}`);
}

/** `GET /api/polizas/{id}/cuotas`: cuotas ordenadas por `numero`, sin paginación. */
export function listarCuotasDePoliza(api: ApiClient, id: string): Promise<CuotaResponse[]> {
  return api.get<CuotaResponse[]>(`/api/polizas/${id}/cuotas`);
}

/**
 * `POST /api/polizas/{id}/cancelar`: cancela la póliza y anula las cuotas impagas (RN13).
 * No reintenta (FC11): la acción es irreversible.
 */
export function cancelarPoliza(
  api: ApiClient,
  id: string,
  body: CancelarPolizaRequest,
): Promise<PolizaDetalleResponse> {
  return api.post<PolizaDetalleResponse>(`/api/polizas/${id}/cancelar`, body);
}

/**
 * MOCK (PB-06): búsqueda por número, DNI y plan.
 * El back todavía ignora `numero`, `dni` y `planCodigo`; solo la implementa el handler MSW.
 * No se conecta a la UI hasta que PB-06 se publique (RV-D29).
 */
export function buscarPolizasMock(
  api: ApiClient,
  filtro: PolizaBusquedaMock = {},
): Promise<PaginaResponse<PolizaListItemResponse>> {
  return listarPolizas(api, filtro);
}
