import { z } from 'zod';

/** "Todos" no viaja al back: el parámetro se omite. */
export const filtrosPagosSchema = z.object({
  medio: z.enum(['Todos', 'CAJA', 'PAGO_FACIL', 'PASARELA']).default('Todos'),
  estado: z.enum(['Todos', 'PENDIENTE', 'APROBADO', 'RECHAZADO']).default('Todos'),
  pagina: z.number().int().min(1).default(1),
});
