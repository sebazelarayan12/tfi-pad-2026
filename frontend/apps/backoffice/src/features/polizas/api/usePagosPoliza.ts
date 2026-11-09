import { listarPagosDePoliza, pagosKeys, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/** Pagos de una póliza para el rail de B10 (`GET /api/polizas/{id}/pagos`). */
export function usePagosPoliza(polizaId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: pagosKeys.porPoliza(polizaId),
    queryFn: () => listarPagosDePoliza(api, polizaId),
    enabled: polizaId !== '',
  });
}
