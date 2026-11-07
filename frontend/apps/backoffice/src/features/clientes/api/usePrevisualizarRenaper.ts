import { clientesKeys, isApiError, previsualizarRenaper, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

const ESPERA_REINTENTO_MS = 500;

/** Un solo reintento y solo ante 502 (D-25-2, RV-D23): más consumiría cupo de un Renaper caído. */
export function reintentarSolo502(intentos: number, error: unknown): boolean {
  return intentos < 1 && isApiError(error) && error.kind === 'http' && error.status === 502;
}

/**
 * Consulta de Renaper para el alta. No se dispara sola: el botón llama a `refetch` (FC11).
 * La clave lleva el DNI; con `gcTime: 0` cambiar el DNI descarta el resultado anterior, así el
 * rail vuelve al estado inicial sin código extra. El DNI viaja en la URL: no se loguea.
 */
export function usePrevisualizarRenaper(dni: string) {
  const cliente = useApiClient();
  return useQuery({
    queryKey: clientesKeys.renaper(dni),
    queryFn: () => previsualizarRenaper(cliente, dni),
    enabled: false,
    retry: reintentarSolo502,
    retryDelay: ESPERA_REINTENTO_MS,
    gcTime: 0,
    staleTime: 0,
    networkMode: 'always',
  });
}
