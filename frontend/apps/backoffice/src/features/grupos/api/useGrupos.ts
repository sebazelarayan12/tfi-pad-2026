import { gruposKeys, listarGrupos, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/** Sin paginación en la UI: se pide una página de 100, las solicitudes más nuevas primero. */
const FILTRO = { pagina: 1, tamano: 100 } as const;

export function useGrupos() {
  const cliente = useApiClient();
  return useQuery({
    queryKey: gruposKeys.lista(FILTRO),
    queryFn: () => listarGrupos(cliente, FILTRO),
    retry: 0,
  });
}
