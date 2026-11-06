import type { ApiClient } from '../client';
import type {
  CotizacionDto,
  CotizacionResultado,
  CotizarVehiculoRequest,
} from '../dto/cotizaciones';

export const cotizacionesKeys = {
  detalle: (id: string) => ['cotizaciones', 'detalle', id] as const,
};

/** CU09/PB-26: cada POST persiste nuevas opciones; el consumidor lo dispara solo al clic. */
export function cotizarVehiculo(
  api: ApiClient,
  cuerpo: CotizarVehiculoRequest,
): Promise<CotizacionResultado> {
  return api.post<CotizacionResultado>('/api/cotizaciones', cuerpo);
}

export function obtenerCotizacion(api: ApiClient, id: string): Promise<CotizacionDto> {
  return api.get<CotizacionDto>(`/api/cotizaciones/${encodeURIComponent(id)}`);
}
