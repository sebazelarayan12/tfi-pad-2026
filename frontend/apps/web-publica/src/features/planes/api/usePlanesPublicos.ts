import { listarPlanes, planesKeys, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/**
 * Planes activos de `GET /api/planes` (anónimo). Sin reintento automático: ante un error el
 * usuario decide con "Reintentar" (FC13, ficha W-02 §6.1).
 */
export function usePlanesPublicos() {
  const cliente = useApiClient();
  return useQuery({
    queryKey: planesKeys.lista(),
    queryFn: () => listarPlanes(cliente),
    retry: false,
  });
}
