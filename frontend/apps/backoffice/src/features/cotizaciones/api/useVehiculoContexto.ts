import { obtenerVehiculo, useApiClient, vehiculosKeys } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

export function useVehiculoContexto(vehiculoId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: vehiculosKeys.detalle(vehiculoId),
    queryFn: () => obtenerVehiculo(api, vehiculoId),
    retry: false,
  });
}
