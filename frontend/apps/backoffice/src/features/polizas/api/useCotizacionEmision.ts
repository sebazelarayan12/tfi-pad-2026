import {
  clientesKeys,
  cotizacionesKeys,
  obtenerCliente,
  obtenerCotizacion,
  obtenerPlan,
  obtenerVehiculo,
  planesKeys,
  useApiClient,
  vehiculosKeys,
} from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

export function useCotizacionEmision(id: string) {
  const api = useApiClient();
  const cotizacion = useQuery({
    queryKey: cotizacionesKeys.detalle(id),
    queryFn: () => obtenerCotizacion(api, id),
    retry: false,
  });
  const { clienteId, vehiculoId, planId } = cotizacion.data ?? {};
  const cliente = useQuery({
    queryKey: clientesKeys.detalle(clienteId ?? ''),
    queryFn: () => obtenerCliente(api, clienteId!),
    enabled: Boolean(clienteId),
    retry: false,
  });
  const vehiculo = useQuery({
    queryKey: vehiculosKeys.detalle(vehiculoId ?? ''),
    queryFn: () => obtenerVehiculo(api, vehiculoId!),
    enabled: Boolean(vehiculoId),
    retry: false,
  });
  const plan = useQuery({
    queryKey: planesKeys.detalle(planId ?? ''),
    queryFn: () => obtenerPlan(api, planId!),
    enabled: Boolean(planId),
    retry: false,
  });
  return { cotizacion, cliente, vehiculo, plan };
}
