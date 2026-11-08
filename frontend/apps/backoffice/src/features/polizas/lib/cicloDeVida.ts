import {
  formatearFechaCalendario,
  formatearFechaHora,
  TEXTO_SIN_DATO,
  type PolizaDetalleResponse,
} from '@nexa/api';

import { NOTA_AL_PAGAR_VENCIDAS, TEXTO_NO_DISPONIBLE_DETALLE } from '../textosDetalle';

const ESTADO_CUOTA_PAGADA = 2;

export type NumeroPaso = 1 | 2 | 3 | 4 | 5;

export interface PasoCiclo {
  numero: NumeroPaso;
  estado: string;
  nota: string;
}

export interface CicloDeVida {
  pasos: PasoCiclo[];
  /** `undefined` cuando ningún paso representa el estado (Cancelada, DP-B15-06). */
  actual: NumeroPaso | undefined;
}

type DatosCiclo = Pick<PolizaDetalleResponse, 'fechaEmision' | 'fechaFin' | 'cuotas'> & {
  estado: number;
};

/** Estado de la póliza (número del back) → paso actual. Cancelada no tiene paso. */
const PASO_POR_ESTADO: Partial<Record<number, NumeroPaso>> = { 0: 1, 1: 2, 2: 3, 4: 5 };

/** `fechaEmision` y `fechaPago` son DateTime en UTC: se muestran como fecha de Argentina. */
export function fechaArgentina(valor: string | null | undefined): string {
  const fechaHora = formatearFechaHora(valor);
  return fechaHora === TEXTO_SIN_DATO ? fechaHora : fechaHora.slice(0, 10);
}

function notaActivacion({ cuotas }: DatosCiclo): string {
  const primera = cuotas.find((cuota) => cuota.numero === 1);
  if (primera?.estado !== ESTADO_CUOTA_PAGADA || primera.fechaPago === null) return '';
  return `${fechaArgentina(primera.fechaPago)}, cuota 1 pagada`;
}

/** Los 5 pasos de la línea de vida (B10 §5). El paso 3 no tiene fecha: el back no la guarda (PB-27). */
export function cicloDeVida(poliza: DatosCiclo): CicloDeVida {
  return {
    actual: PASO_POR_ESTADO[poliza.estado],
    pasos: [
      { numero: 1, estado: 'Pendiente', nota: `Emitida ${fechaArgentina(poliza.fechaEmision)}` },
      { numero: 2, estado: 'Vigente', nota: notaActivacion(poliza) },
      { numero: 3, estado: 'Suspendida', nota: TEXTO_NO_DISPONIBLE_DETALLE },
      { numero: 4, estado: 'Vigente', nota: NOTA_AL_PAGAR_VENCIDAS },
      { numero: 5, estado: 'Vencida', nota: formatearFechaCalendario(poliza.fechaFin) },
    ],
  };
}
