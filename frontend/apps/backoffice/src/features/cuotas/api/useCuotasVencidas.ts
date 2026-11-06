import { cuotasKeys, listarCuotasVencidasMock, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

const filtro = { pagina: 1, tamano: 5, orden: 'fechaVencimiento' };

export function useCuotasVencidas() {
  const cliente = useApiClient();
  return useQuery({
    queryKey: cuotasKeys.vencidas(filtro),
    queryFn: () => listarCuotasVencidasMock(cliente, filtro),
    select: ({ items }) => items.slice(0, filtro.tamano),
    retry: false,
    networkMode: 'always',
  });
}
