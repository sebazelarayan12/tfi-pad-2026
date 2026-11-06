import {
  listarPagosMock,
  pagosKeys,
  useApiClient,
  type PagoListadoFiltroMock,
  type PagoListadoResponse,
  type PaginaResponse,
} from '@nexa/api';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { FiltrosPagos } from '../types/filtrosPagos';

/** D-01: 10 filas por página. */
export const TAMANO_PAGINA_PAGOS = 10;

/** "Todos" se omite; nunca se envía un rango de fechas (el back no tiene ese filtro, D-B19-02). */
function aQuery({ medio, estado, pagina }: FiltrosPagos): PagoListadoFiltroMock {
  return {
    pagina,
    tamano: TAMANO_PAGINA_PAGOS,
    ...(medio === 'Todos' ? {} : { medio }),
    ...(estado === 'Todos' ? {} : { estado }),
  };
}

/** MOCK (PB-05): `GET /api/pagos` no existe en el back; lo responde el handler MSW. */
export function usePagosListado(filtros: FiltrosPagos) {
  const api = useApiClient();
  const query = aQuery(filtros);

  return useQuery<PaginaResponse<PagoListadoResponse>>({
    queryKey: pagosKeys.lista(query),
    queryFn: () => listarPagosMock(api, query),
    placeholderData: keepPreviousData,
  });
}
