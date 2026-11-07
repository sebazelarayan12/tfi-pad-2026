import { obtenerPlan, planesKeys, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

export function usePlan(id: string) {
  const cliente = useApiClient();
  return useQuery({ queryKey: planesKeys.detalle(id), queryFn: () => obtenerPlan(cliente, id) });
}
