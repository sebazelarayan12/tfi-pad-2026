import { listarVehiculosDeCliente, useApiClient, vehiculosKeys } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/** Vehículos activos del cliente. Sin paginación; se pide solo cuando el cliente ya cargó. */
export function useVehiculosDelCliente(clienteId: string, habilitado: boolean) {
  const api = useApiClient();
  return useQuery({
    queryKey: vehiculosKeys.listaPorCliente(clienteId),
    queryFn: () => listarVehiculosDeCliente(api, clienteId),
    enabled: habilitado,
    retry: false,
  });
}
