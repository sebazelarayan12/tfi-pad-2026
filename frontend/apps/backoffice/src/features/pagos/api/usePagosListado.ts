import {
  listarPagos,
  pagosKeys,
  useApiClient,
  type PagoListadoFiltro,
  type PagoListadoResponse,
  type PaginaResponse,
} from '@nexa/api';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { FiltrosPagos } from '../types/filtrosPagos';

/** D-01: 10 filas por página. */
export const TAMANO_PAGINA_PAGOS = 10;

/** "Todos" se omite; nunca se envía un rango de fechas (el back no tiene ese filtro, D-B19-02). */
function aQuery({ medio, estado, pagina }: FiltrosPagos): PagoListadoFiltro {
  return {
    pagina,
    tamano: TAMANO_PAGINA_PAGOS,
    ...(medio === 'Todos' ? {} : { medio }),
    ...(estado === 'Todos' ? {} : { estado }),
  };
}

/** Listado de pagos de B-19 (`GET /api/pagos`). */
export function usePagosListado(filtros: FiltrosPagos) {
  const api = useApiClient();
  const query = aQuery(filtros);

  return useQuery<PaginaResponse<PagoListadoResponse>>({
    queryKey: pagosKeys.lista(query),
    queryFn: () => listarPagos(api, query),
    placeholderData: keepPreviousData,
  });
}
