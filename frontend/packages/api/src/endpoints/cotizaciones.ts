import type { ApiClient } from '../client';
import type { PaginaResponse } from '../dto/comunes';
import type {
  CotizacionDto,
  CotizacionListadoFiltro,
  CotizacionListItemResponse,
  CotizacionResultado,
  CotizarVehiculoRequest,
} from '../dto/cotizaciones';

export const cotizacionesKeys = {
  all: ['cotizaciones'] as const,
  lista: (filtro: CotizacionListadoFiltro = {}) => ['cotizaciones', 'lista', filtro] as const,
  detalle: (id: string) => ['cotizaciones', 'detalle', id] as const,
};

/** CU09/PB-26: cada POST persiste nuevas opciones; el consumidor lo dispara solo al clic. */
export function cotizarVehiculo(
  api: ApiClient,
  cuerpo: CotizarVehiculoRequest,
): Promise<CotizacionResultado> {
  return api.post<CotizacionResultado>('/api/cotizaciones', cuerpo);
}

/** `GET /api/cotizaciones`: listado paginado, de la más nueva a la más vieja. */
export function listarCotizaciones(
  api: ApiClient,
  filtro: CotizacionListadoFiltro = {},
): Promise<PaginaResponse<CotizacionListItemResponse>> {
  return api.get<PaginaResponse<CotizacionListItemResponse>>('/api/cotizaciones', {
    query: { ...filtro },
  });
}

export function obtenerCotizacion(api: ApiClient, id: string): Promise<CotizacionDto> {
  return api.get<CotizacionDto>(`/api/cotizaciones/${encodeURIComponent(id)}`);
}
