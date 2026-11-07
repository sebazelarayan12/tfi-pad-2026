import { clientesKeys, obtenerCliente, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/** `GET /api/clientes/{id}`: nombre y DNI, que el detalle no trae (DP-B15-01). Si falla, no bloquea. */
export function useClienteDatos(clienteId: string | undefined) {
  const api = useApiClient();
  return useQuery({
    queryKey: clientesKeys.detalle(clienteId ?? ''),
    queryFn: () => obtenerCliente(api, clienteId ?? ''),
    enabled: clienteId !== undefined,
    retry: false,
  });
}
