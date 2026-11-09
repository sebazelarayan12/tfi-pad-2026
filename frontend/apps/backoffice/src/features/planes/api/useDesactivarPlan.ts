import { desactivarPlan, isApiError, planesKeys, useApiClient } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDesactivarPlan() {
  const api = useApiClient();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => desactivarPlan(api, id),
    retry: 0,
    networkMode: 'always',
    onSuccess: async (_, id) => {
      await cache.invalidateQueries({ queryKey: planesKeys.detalle(id), refetchType: 'none' });
      await cache.invalidateQueries({ queryKey: ['planes', 'lista'] });
    },
    onError: async (error) => {
      if (isApiError(error) && error.status === 404) {
        await cache.invalidateQueries({ queryKey: ['planes', 'lista'] });
      }
    },
  });
}
