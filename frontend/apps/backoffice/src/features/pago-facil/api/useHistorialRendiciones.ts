import { listarRendiciones, pagoFacilKeys, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

export function useHistorialRendiciones() {
  const cliente = useApiClient();
  return useQuery({
    queryKey: pagoFacilKeys.rendiciones(),
    queryFn: () => listarRendiciones(cliente),
  });
}
