import { clientesKeys, listarClientes, useApiClient, type ClienteFiltro } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

export const TAMANO_PAGINA = 10;

export function useClientes(
  filtro: Pick<ClienteFiltro, 'dni' | 'apellido'>,
  pagina: number,
  enabled = true,
) {
  const api = useApiClient();
  const parametros: ClienteFiltro = { ...filtro, pagina, tamanoPagina: TAMANO_PAGINA };
  return useQuery({
    queryKey: clientesKeys.lista(parametros),
    queryFn: () => listarClientes(api, parametros),
    retry: false,
    enabled,
  });
}
