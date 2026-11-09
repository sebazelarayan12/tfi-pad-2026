import { z } from 'zod';

/** "Todas" no viaja al back: el parámetro `vigente` se omite. */
export const filtrosCotizacionesSchema = z.object({
  vigencia: z.enum(['Todas', 'Vigentes', 'Vencidas']).default('Todas'),
  pagina: z.number().int().min(1).default(1),
});

export type FiltrosCotizaciones = z.infer<typeof filtrosCotizacionesSchema>;
