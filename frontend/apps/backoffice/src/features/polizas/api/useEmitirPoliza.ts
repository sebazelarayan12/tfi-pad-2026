import { emitirPoliza, polizasKeys, useApiClient, type EmitirPolizaRequest } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useEmitirPoliza() {
  const api = useApiClient();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: (body: EmitirPolizaRequest) => emitirPoliza(api, body),
    retry: 0,
    networkMode: 'always',
    onSuccess: (poliza) => {
      cache.setQueryData(polizasKeys.detalle(poliza.id), poliza);
      void cache.invalidateQueries({ queryKey: [...polizasKeys.all, 'lista'] });
    },
  });
}
