import { z } from 'zod';

export const vigencias = [1, 6, 12] as const;
export type VigenciaMeses = (typeof vigencias)[number];

export const emisionSchema = z.object({
  vigenciaMeses: z.union([z.literal(1), z.literal(6), z.literal(12)]),
});

export const cotizacionIdSchema = z.guid();
