import { listarPlanes, planesKeys, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

export function usePlanesCatalogo() {
  const api = useApiClient();
  return useQuery({
    queryKey: planesKeys.lista(),
    queryFn: () => listarPlanes(api),
  });
}
