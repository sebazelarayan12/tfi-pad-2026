import { listarPlanesIncluyendoInactivos, planesKeys, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';
import { FILTRO_INACTIVOS_DISPONIBLE } from '../config';

export function usePlanesInactivos(mostrar: boolean) {
  const api = useApiClient();
  return useQuery({
    queryKey: planesKeys.lista({ incluirInactivos: true }),
    queryFn: () => listarPlanesIncluyendoInactivos(api),
    enabled: FILTRO_INACTIVOS_DISPONIBLE && mostrar,
  });
}
