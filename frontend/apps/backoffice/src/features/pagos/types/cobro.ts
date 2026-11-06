import type { CuotaResponse } from '@nexa/api';

/** Cuota mínima que necesita la UI de cobro en caja. */
export type CuotaCobrable = Pick<
  CuotaResponse,
  'id' | 'numero' | 'importe' | 'recargo' | 'estado' | 'fechaVencimiento'
>;
