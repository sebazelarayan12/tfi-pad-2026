import { isApiError, type PaginaResponse, type PolizaListItemResponse } from '@nexa/api';
import type { UseQueryResult } from '@tanstack/react-query';
import { useState } from 'react';

type Pagina = PaginaResponse<PolizaListItemResponse>;

const STATUS_FILTRO_INVALIDO = 400;

export interface VistaListado {
  /** Filas a mostrar; `null` si no hay tabla (primera carga o error que no es de filtro). */
  filas: PolizaListItemResponse[] | null;
  total: number;
  cargandoPrimera: boolean;
  error: unknown;
  hayError: boolean;
  /** 400 de filtro: se conserva la tabla anterior y no hay "Reintentar". */
  errorDeFiltro: boolean;
}

/**
 * Traduce la consulta a lo que muestra la pantalla. Un 400 de filtro conserva la tabla anterior:
 * `placeholderData` no sobrevive a un error, así que se guarda la última página recibida.
 */
export function useVistaListado(consulta: UseQueryResult<Pagina>): VistaListado {
  const [ultimaPagina, setUltimaPagina] = useState<Pagina | undefined>(undefined);
  if (consulta.data && !consulta.isPlaceholderData && consulta.data !== ultimaPagina) {
    setUltimaPagina(consulta.data);
  }
  const datos = consulta.data ?? ultimaPagina;

  const hayError = consulta.isError;
  const errorDeFiltro =
    hayError && isApiError(consulta.error) && consulta.error.status === STATUS_FILTRO_INVALIDO;
  const conservaTabla = datos !== undefined && (!hayError || errorDeFiltro);

  return {
    filas: conservaTabla ? datos.items : null,
    total: datos?.total ?? 0,
    cargandoPrimera: datos === undefined && !hayError,
    error: consulta.error,
    hayError,
    errorDeFiltro,
  };
}
