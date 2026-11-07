import { clientesKeys, isApiError, obtenerCliente, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

const ESPERA_REINTENTO_MS = 500;

/** Solo un fallo de red se reintenta, una vez: un 404 o un 5xx no mejoran por repetirse. */
export function reintentarSoloRed(intentos: number, error: unknown): boolean {
  return intentos < 1 && isApiError(error) && error.kind === 'red';
}

/** Detalle del cliente de la ficha. Dueño: B-07 (INDEX); B-08 invalida esta clave al editar. */
export function useCliente(clienteId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: clientesKeys.detalle(clienteId),
    queryFn: () => obtenerCliente(api, clienteId),
    retry: reintentarSoloRed,
    retryDelay: ESPERA_REINTENTO_MS,
  });
}
