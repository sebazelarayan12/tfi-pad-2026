import { ApiError, clientesKeys, obtenerCliente, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

export function useClienteContexto(clienteId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: clientesKeys.detalle(clienteId),
    queryFn: () => obtenerCliente(api, clienteId),
    retry: (intentos, error) =>
      intentos < 1 && (!(error instanceof ApiError) || error.status === 0 || error.status >= 500),
  });
}
