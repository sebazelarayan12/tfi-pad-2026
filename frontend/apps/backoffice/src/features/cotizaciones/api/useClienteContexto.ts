import { clientesKeys, obtenerCliente, useApiClient } from '@nexa/api';
import { skipToken, useQuery } from '@tanstack/react-query';

export function useClienteContexto(clienteId: string | undefined) {
  const api = useApiClient();
  return useQuery({
    queryKey: clientesKeys.detalle(clienteId ?? ''),
    queryFn: clienteId ? () => obtenerCliente(api, clienteId) : skipToken,
    retry: false,
  });
}
