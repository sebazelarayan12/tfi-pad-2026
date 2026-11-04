import { isApiError } from '@nexa/api';
import { QueryClient } from '@tanstack/react-query';

const MAX_REINTENTOS_CONSULTA = 2;
const STATUS_TOO_MANY_REQUESTS = 429;
const STATUS_SERVER_ERROR = 500;

/**
 * Reintenta consultas solo ante errores de red o 5xx, hasta 2 veces (FC13, DP-3).
 * Los 4xx y el 429 no se reintentan.
 */
export function reintentarConsulta(intento: number, error: unknown): boolean {
  if (isApiError(error) && error.status !== 0) {
    const noReintentable =
      error.status < STATUS_SERVER_ERROR || error.status === STATUS_TOO_MANY_REQUESTS;
    if (noReintentable) return false;
  }
  return intento < MAX_REINTENTOS_CONSULTA;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: { retry: 0 },
    queries: { retry: reintentarConsulta, staleTime: 0 },
  },
});
