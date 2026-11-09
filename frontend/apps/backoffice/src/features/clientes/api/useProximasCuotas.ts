import {
  listarCuotasDePoliza,
  polizasKeys,
  useApiClient,
  type PolizaListItemResponse,
} from '@nexa/api';
import { useQueries } from '@tanstack/react-query';

import { proximaCuota } from './proximaCuota';
import { esPolizaActiva } from './reglaPolizaActiva';

export interface ProximoVencimiento {
  /** `true` mientras las cuotas de la póliza no llegaron: la tabla muestra "-" y no se bloquea. */
  cargando: boolean;
  /** `yyyy-MM-dd` de la primera cuota Pendiente, o `undefined` si no hay. */
  fecha: string | undefined;
}

/**
 * Una consulta de cuotas por póliza activa (N+1: el back no manda el próximo vencimiento).
 * Las pólizas Vencida o Cancelada no piden cuotas. Devuelve el resultado por id de póliza.
 */
export function useProximasCuotas(polizas: readonly PolizaListItemResponse[]) {
  const api = useApiClient();
  const activas = polizas.filter(esPolizaActiva);
  const consultas = useQueries({
    queries: activas.map((poliza) => ({
      queryKey: polizasKeys.cuotas(poliza.id),
      queryFn: () => listarCuotasDePoliza(api, poliza.id),
      retry: false,
    })),
  });

  const porPoliza = new Map<string, ProximoVencimiento>();
  activas.forEach((poliza, indice) => {
    const consulta = consultas[indice];
    porPoliza.set(poliza.id, {
      cargando: consulta?.isPending ?? true,
      fecha: consulta?.data ? proximaCuota(consulta.data)?.fechaVencimiento : undefined,
    });
  });
  return porPoliza;
}
