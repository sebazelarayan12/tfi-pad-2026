import { listarUsuariosMock, useApiClient, usuariosKeys } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/** Sin paginación en la UI (D-B25-01): se pide una página de 100. */
const FILTRO = { pagina: 1, tamano: 100 } as const;

export function useUsuarios() {
  const cliente = useApiClient();
  return useQuery({
    queryKey: usuariosKeys.lista(FILTRO),
    queryFn: () => listarUsuariosMock(cliente, FILTRO),
    retry: 0,
  });
}
