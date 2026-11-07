import { z } from 'zod';

export const parametrosCotizacion = z.object({
  vehiculoId: z.guid(),
  clienteId: z.guid().optional().catch(undefined),
});
