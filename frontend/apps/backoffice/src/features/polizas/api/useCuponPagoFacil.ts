import { obtenerCuponEmpleado, pagoFacilKeys, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/**
 * `GET /api/pagofacil/cuotas/{cuotaId}/cupon`. Solo se pide con `refetch()` al clic y no se
 * guarda: los vencimientos dependen de la fecha y el contrato prohíbe cachearlo entre días.
 */
export function useCuponPagoFacil(cuotaId: string | null) {
  const api = useApiClient();
  return useQuery({
    queryKey: pagoFacilKeys.cuponEmpleado(cuotaId ?? ''),
    queryFn: () => obtenerCuponEmpleado(api, cuotaId ?? ''),
    enabled: false,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    networkMode: 'always',
  });
}
