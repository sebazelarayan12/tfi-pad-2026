import {
  listarPolizas,
  polizasKeys,
  useApiClient,
  type PaginaResponse,
  type PolizaBusquedaMock,
  type PolizaListItemResponse,
} from '@nexa/api';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { FiltrosPolizas } from '../schemas/polizasListadoQuery';

/** D-01: 10 filas por página. */
export const TAMANO_PAGINA = 10;

/** Búsqueda ya resuelta por `useBusquedaPolizas`. `numero` solo llega con la constante en `true`. */
export interface BusquedaListado {
  patente?: string;
  clienteId?: string;
  numero?: string;
  enabled?: boolean;
}

/** Solo envía `estado` si hay uno elegido. Nunca `dni` ni `planCodigo` (PB-06). */
function aQuery(
  { estado, pagina }: FiltrosPolizas,
  { patente, clienteId, numero }: BusquedaListado,
): PolizaBusquedaMock {
  return {
    pagina,
    tamano: TAMANO_PAGINA,
    ...(estado === undefined ? {} : { estado }),
    ...(patente === undefined ? {} : { patente }),
    ...(clienteId === undefined ? {} : { clienteId }),
    ...(numero === undefined ? {} : { numero }),
  };
}

export function usePolizasListado(filtros: FiltrosPolizas, busqueda: BusquedaListado = {}) {
  const api = useApiClient();
  const query = aQuery(filtros, busqueda);

  return useQuery<PaginaResponse<PolizaListItemResponse>>({
    queryKey: polizasKeys.lista(query),
    queryFn: () => listarPolizas(api, query),
    placeholderData: keepPreviousData,
    enabled: busqueda.enabled ?? true,
  });
}
