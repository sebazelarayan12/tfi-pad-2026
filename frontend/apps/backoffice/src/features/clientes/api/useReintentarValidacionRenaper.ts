import { clientesKeys, useApiClient, validarRenaper } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useReintentarValidacionRenaper(id: string) {
  const api = useApiClient();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: () => validarRenaper(api, id),
    onSuccess: (cliente) => {
      cache.setQueryData(clientesKeys.detalle(id), cliente);
      void cache.invalidateQueries({ queryKey: clientesKeys.listas() });
    },
    retry: 0,
    networkMode: 'always',
  });
}
