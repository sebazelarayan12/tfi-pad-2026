import { listarPolizas, polizasKeys, useApiClient } from '@nexa/api';
import { useQueries } from '@tanstack/react-query';
import { ESTADOS_POLIZA, type EstadoPolizaInicio, type Indicador } from '../types/indicadores';

export function useConteosPolizas(): Record<EstadoPolizaInicio, Indicador> {
  const cliente = useApiClient();
  const [Vigente, Pendiente, Suspendida, Cancelada, Vencida] = useQueries({
    queries: ESTADOS_POLIZA.map((estado) => {
      const filtro = { estado, pagina: 1, tamano: 1 };
      return {
        queryKey: polizasKeys.lista(filtro),
        queryFn: () => listarPolizas(cliente, filtro),
        select: (respuesta: Awaited<ReturnType<typeof listarPolizas>>) => respuesta.total,
        retry: false,
        networkMode: 'always' as const,
      };
    }),
  });
  return { Vigente, Pendiente, Suspendida, Cancelada, Vencida };
}
