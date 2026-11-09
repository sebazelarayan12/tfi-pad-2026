import { clientesKeys, crearVehiculo, useApiClient, vehiculosKeys } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toVehiculoAltaRequest, type VehiculoAltaValues } from '../schemas/vehiculoAltaSchema';

export function useAltaVehiculo(clienteId: string) {
  const api = useApiClient();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: (valores: VehiculoAltaValues) =>
      crearVehiculo(api, toVehiculoAltaRequest(valores, clienteId)),
    retry: 0,
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: vehiculosKeys.listaPorCliente(clienteId) });
      void cache.invalidateQueries({ queryKey: clientesKeys.detalle(clienteId) });
    },
  });
}
