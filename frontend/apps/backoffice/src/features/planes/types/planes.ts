import type { z } from 'zod';
import type { planSchema } from '../schemas/planSchema';

export type PlanFormValues = z.input<typeof planSchema>;
export type PlanFormValidado = z.output<typeof planSchema>;
export type TipoVehiculoPlan = PlanFormValues['tiposPermitidos'][number];
