import { ESTADO_CUOTA_NUMERO, ESTADO_POLIZA_NUMERO, type CuotaResponse } from '@nexa/api';

export interface ReglasAcciones {
  puedeCancelar: boolean;
  puedeCupon: boolean;
  /** Cuota elegible de menor número (DP-B16-02); `null` si no hay ninguna. */
  cuotaCupon: CuotaResponse | null;
}

const ESTADOS_CANCELABLES: ReadonlyArray<number> = [
  ESTADO_POLIZA_NUMERO.Pendiente,
  ESTADO_POLIZA_NUMERO.Vigente,
  ESTADO_POLIZA_NUMERO.Suspendida,
];

const esElegibleParaCupon = (cuota: CuotaResponse) =>
  cuota.estado === ESTADO_CUOTA_NUMERO.Pendiente || cuota.estado === ESTADO_CUOTA_NUMERO.Vencida;

/**
 * Habilitación de las acciones de B10 §7. El cupón de una póliza Vencida queda habilitado
 * mientras haya cuotas elegibles (DP-B16-03, PB-30).
 */
export function reglasAcciones(
  estadoPoliza: number,
  cuotas: ReadonlyArray<CuotaResponse>,
): ReglasAcciones {
  const cuotaCupon =
    estadoPoliza === ESTADO_POLIZA_NUMERO.Cancelada
      ? null
      : ([...cuotas].filter(esElegibleParaCupon).sort((a, b) => a.numero - b.numero)[0] ?? null);
  return {
    puedeCancelar: ESTADOS_CANCELABLES.includes(estadoPoliza),
    puedeCupon: cuotaCupon !== null,
    cuotaCupon,
  };
}
