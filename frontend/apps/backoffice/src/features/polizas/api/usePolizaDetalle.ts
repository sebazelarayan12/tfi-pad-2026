import { isApiError, obtenerPoliza, polizasKeys, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ESPERA_REINTENTO_MS = 500;

export const esIdValido = (id: string) => UUID.test(id);

/** Solo un fallo de red se reintenta, una vez: un 404 o un 5xx no mejoran por repetirse. */
function reintentarSoloRed(intentos: number, error: unknown): boolean {
  return intentos < 1 && isApiError(error) && error.kind === 'red';
}

/** `GET /api/polizas/{id}`. Un id que no es UUID no hace request: la pantalla dice "no existe". */
export function usePolizaDetalle(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: polizasKeys.detalle(id),
    queryFn: () => obtenerPoliza(api, id),
    enabled: esIdValido(id),
    retry: reintentarSoloRed,
    retryDelay: ESPERA_REINTENTO_MS,
  });
}
