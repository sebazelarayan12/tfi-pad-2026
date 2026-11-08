import { z } from 'zod';

import { PROVINCIAS } from './provincias';

export const modificacionClienteSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresá el email.')
    .max(150, 'Usá hasta 150 caracteres.')
    .pipe(z.email('El email no tiene un formato válido.')),
  telefono: z
    .string()
    .trim()
    .max(20, 'Usá hasta 20 caracteres.')
    .transform((valor) => valor || null),
  calle: z.string().trim().min(1, 'Ingresá la calle.').max(150, 'Usá hasta 150 caracteres.'),
  numero: z.string().trim().min(1, 'Ingresá el número.').max(20, 'Usá hasta 20 caracteres.'),
  localidad: z
    .string()
    .trim()
    .min(1, 'Ingresá la localidad.')
    .max(100, 'Usá hasta 100 caracteres.'),
  provincia: z
    .string()
    .refine((valor) => PROVINCIAS.some((provincia) => provincia === valor), 'Elegí una provincia.'),
  codigoPostal: z
    .string()
    .trim()
    .min(1, 'Ingresá el código postal.')
    .max(10, 'Usá hasta 10 caracteres.'),
});

export type ModificacionClienteCampos = z.input<typeof modificacionClienteSchema>;
export type ModificacionClienteValidada = z.output<typeof modificacionClienteSchema>;
