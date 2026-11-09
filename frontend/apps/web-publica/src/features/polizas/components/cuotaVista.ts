import { formatearFechaCalendario, type CuotaPublica, type EstadoCuotaPublica } from '@nexa/api';
import type { BadgeEstado } from '@nexa/ui';

export const BADGE_POR_ESTADO: Record<EstadoCuotaPublica, BadgeEstado> = {
  PAGADA: 'Pagada',
  PENDIENTE: 'Pendiente',
  VENCIDA: 'Vencida',
  ANULADA: 'Anulada',
};

/** Texto fijo del recargo por vencimiento (RN08). */
const TEXTO_RECARGO = ', recargo 5%';

/** Vencimiento de una cuota, con el recargo cuando corresponde. La comparten escritorio y móvil. */
export function textoVencimiento(cuota: CuotaPublica): string {
  const fecha = formatearFechaCalendario(cuota.vencimiento);
  return cuota.recargo > 0 ? `${fecha}${TEXTO_RECARGO}` : fecha;
}
