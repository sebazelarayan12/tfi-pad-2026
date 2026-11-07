import { listarPlanes, planesKeys, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

export function usePlanes() {
  const cliente = useApiClient();
  return useQuery({ queryKey: planesKeys.lista(), queryFn: () => listarPlanes(cliente) });
}
