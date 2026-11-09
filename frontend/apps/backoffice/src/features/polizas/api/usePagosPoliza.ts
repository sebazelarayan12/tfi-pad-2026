import { listarPagosDePolizaMock, pagosKeys, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/**
 * Pagos de una póliza para el rail de B10.
 * MOCK (PB-05): `GET /api/polizas/{id}/pagos` todavía no existe en el back.
 */
export function usePagosPoliza(polizaId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: pagosKeys.porPoliza(polizaId),
    queryFn: () => listarPagosDePolizaMock(api, polizaId),
    enabled: polizaId !== '',
  });
}
