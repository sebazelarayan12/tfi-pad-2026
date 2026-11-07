import type { CuotaResponse } from '@nexa/api';

/** Lo que se cobra: `importe + recargo` (DP-B15-04). Redondea a centavos para evitar 0,1 + 0,2. */
export function importeCuota({ importe, recargo }: Pick<CuotaResponse, 'importe' | 'recargo'>) {
  return Math.round((importe + recargo) * 100) / 100;
}
