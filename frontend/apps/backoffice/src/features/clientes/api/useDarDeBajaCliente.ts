import { clientesKeys, darDeBajaCliente, useApiClient } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDarDeBajaCliente(id: string) {
  const api = useApiClient();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: () => darDeBajaCliente(api, id),
    onSuccess: async () => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: clientesKeys.listas() }),
        cache.invalidateQueries({ queryKey: clientesKeys.detalle(id), refetchType: 'none' }),
      ]);
    },
    retry: 0,
    networkMode: 'always',
  });
}
