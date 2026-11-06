import { z } from 'zod';

/**
 * Body de `POST /api/pagos/caja` (contrato §6.1).
 * El mensaje es el mismo del back (`PagoCajaRequest.cs:9`).
 */
export const cobroCajaSchema = z.object({
  cuotaIds: z.array(z.string().min(1)).min(1, 'Debe indicar al menos una cuota.'),
});

export type CobroCajaValues = z.infer<typeof cobroCajaSchema>;
