import { cuotasKeys, listarCuotasVencidasMock, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

const PAGINA = { pagina: 1, tamano: 1 };

export function useCuotasVencidasTotal() {
  const cliente = useApiClient();
  return useQuery({
    queryKey: cuotasKeys.vencidas(PAGINA),
    queryFn: () => listarCuotasVencidasMock(cliente, PAGINA),
    select: (respuesta) => respuesta.total,
    retry: false,
    networkMode: 'always',
  });
}
