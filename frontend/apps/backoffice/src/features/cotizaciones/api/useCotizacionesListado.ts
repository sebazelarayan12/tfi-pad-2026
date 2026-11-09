import {
  cotizacionesKeys,
  listarCotizaciones,
  useApiClient,
  type CotizacionListadoFiltro,
  type CotizacionListItemResponse,
  type PaginaResponse,
} from '@nexa/api';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { FiltrosCotizaciones } from '../schemas/filtrosCotizaciones';

/** 10 filas por página, como la tabla de pagos. */
export const TAMANO_PAGINA_COTIZACIONES = 10;

/** "Todas" se omite; el back solo filtra por `vigente=true` o `vigente=false`. */
function aQuery({ vigencia, pagina }: FiltrosCotizaciones): CotizacionListadoFiltro {
  return {
    pagina,
    tamano: TAMANO_PAGINA_COTIZACIONES,
    ...(vigencia === 'Todas' ? {} : { vigente: vigencia === 'Vigentes' }),
  };
}

/** Listado de cotizaciones (`GET /api/cotizaciones`). */
export function useCotizacionesListado(filtros: FiltrosCotizaciones) {
  const api = useApiClient();
  const query = aQuery(filtros);

  return useQuery<PaginaResponse<CotizacionListItemResponse>>({
    queryKey: cotizacionesKeys.lista(query),
    queryFn: () => listarCotizaciones(api, query),
    placeholderData: keepPreviousData,
  });
}
