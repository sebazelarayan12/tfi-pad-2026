import {
  listarPolizas,
  polizasKeys,
  useApiClient,
  type PaginaResponse,
  type PolizaFiltroQuery,
  type PolizaListItemResponse,
} from '@nexa/api';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { FiltrosPolizas } from '../schemas/polizasListadoQuery';

/** D-01: 10 filas por página. */
export const TAMANO_PAGINA = 10;

/** Solo envía `estado` si hay uno elegido. Nunca `numero`, `dni` ni `planCodigo` (PB-06). */
function aQuery({ estado, pagina }: FiltrosPolizas): PolizaFiltroQuery {
  return { pagina, tamano: TAMANO_PAGINA, ...(estado === undefined ? {} : { estado }) };
}

export function usePolizasListado(filtros: FiltrosPolizas) {
  const api = useApiClient();
  const query = aQuery(filtros);

  return useQuery<PaginaResponse<PolizaListItemResponse>>({
    queryKey: polizasKeys.lista(query),
    queryFn: () => listarPolizas(api, query),
    placeholderData: keepPreviousData,
  });
}
