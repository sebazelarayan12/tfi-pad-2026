import { actualizarPlan, isApiError, planesKeys, useApiClient, type PlanRequest } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useActualizarPlan(id: string) {
  const cliente = useApiClient();
  const cache = useQueryClient();

  return useMutation({
    mutationFn: (body: PlanRequest) => actualizarPlan(cliente, id, body),
    retry: 0,
    networkMode: 'always',
    onSuccess: async (plan) => {
      cache.setQueryData(planesKeys.detalle(id), plan);
      await cache.invalidateQueries({ queryKey: planesKeys.lista() });
    },
    onError: async (error) => {
      if (isApiError(error) && error.status === 404) {
        await cache.invalidateQueries({ queryKey: planesKeys.lista() });
      }
    },
  });
}
