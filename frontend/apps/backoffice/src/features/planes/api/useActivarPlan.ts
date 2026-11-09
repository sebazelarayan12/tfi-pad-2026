import { reactivarPlan, planesKeys, useApiClient } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useActivarPlan() {
  const api = useApiClient();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reactivarPlan(api, id, true),
    retry: 0,
    networkMode: 'always',
    onSuccess: async (plan) => {
      cache.setQueryData(planesKeys.detalle(plan.id), plan);
      await cache.invalidateQueries({ queryKey: ['planes', 'lista'] });
    },
  });
}
