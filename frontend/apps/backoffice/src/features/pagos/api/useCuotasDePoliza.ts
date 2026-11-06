import { listarCuotasDePoliza, polizasKeys, useApiClient, type CuotaResponse } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/** `GET /api/polizas/{id}/cuotas`: las cuotas que el rail de caja ofrece cobrar. */
export function useCuotasDePoliza(polizaId: string | undefined) {
  const api = useApiClient();

  return useQuery<CuotaResponse[]>({
    queryKey: polizasKeys.cuotas(polizaId ?? ''),
    queryFn: () => listarCuotasDePoliza(api, polizaId ?? ''),
    enabled: polizaId !== undefined,
  });
}
