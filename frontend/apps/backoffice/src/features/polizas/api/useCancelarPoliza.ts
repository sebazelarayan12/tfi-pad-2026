import { cancelarPoliza, polizasKeys, useApiClient } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/** `POST /api/polizas/{id}/cancelar`. Sin reintento: la cancelación es irreversible (FC11). */
export function useCancelarPoliza(polizaId: string) {
  const api = useApiClient();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: (motivo: string) => cancelarPoliza(api, polizaId, { motivo }),
    retry: 0,
    networkMode: 'always',
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: polizasKeys.detalle(polizaId) });
      void cache.invalidateQueries({ queryKey: polizasKeys.cuotas(polizaId) });
      void cache.invalidateQueries({ queryKey: [...polizasKeys.all, 'lista'] });
    },
  });
}
