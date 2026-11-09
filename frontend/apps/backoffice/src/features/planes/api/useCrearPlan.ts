import { crearPlan, planesKeys, useApiClient, type PlanRequest } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCrearPlan() {
  const api = useApiClient();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: (body: PlanRequest) => crearPlan(api, body),
    retry: 0,
    networkMode: 'always',
    onSuccess: async (plan) => {
      cache.setQueryData(planesKeys.detalle(plan.id), plan);
      await cache.invalidateQueries({ queryKey: ['planes', 'lista'] });
    },
  });
}
