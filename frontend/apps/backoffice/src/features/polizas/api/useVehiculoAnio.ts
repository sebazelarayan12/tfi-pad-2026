import { obtenerVehiculo, useApiClient, vehiculosKeys } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/** `GET /api/vehiculos/{id}`: el detalle de la póliza no trae el año (DP-B15-02). Si falla, no bloquea. */
export function useVehiculoAnio(vehiculoId: string | undefined) {
  const api = useApiClient();
  return useQuery({
    queryKey: vehiculosKeys.detalle(vehiculoId ?? ''),
    queryFn: () => obtenerVehiculo(api, vehiculoId ?? ''),
    enabled: vehiculoId !== undefined,
    retry: false,
  });
}
