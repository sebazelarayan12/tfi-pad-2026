import { z } from 'zod';

/**
 * `location.state` que W4 deja al pagar con PADI (pestaña nueva): el DNI viaja acá y nunca en
 * storage ni en la URL (FC12, RV-D17). Sin estado (vuelta desde otra pasarela o pestaña nueva), la
 * pantalla usa el `numeroPago` de `sessionStorage` y pide el DNI.
 */
const estadoVerificacionSchema = z.object({
  numeroPago: z.string().min(1).max(20),
  dni: z.string().regex(/^\d{8}$/),
  urlPago: z.string().url().nullable(),
  medio: z.literal('padi'),
});

export type EstadoVerificacionPago = z.infer<typeof estadoVerificacionSchema>;

/** Devuelve el estado de W4 o `null` si no hay uno válido. No lanza. */
export function leerEstadoVerificacion(state: unknown): EstadoVerificacionPago | null {
  const resultado = estadoVerificacionSchema.safeParse(state);
  return resultado.success ? resultado.data : null;
}

/** Mensajes del back para el DNI (iguales a los de la consulta de W2). */
export const MENSAJES_DNI = {
  vacio: 'Ingresá tu DNI.',
  formato: 'El DNI debe tener 8 dígitos.',
} as const;

/** DNI que se pide en la pantalla cuando no viene en el estado de navegación. */
export const dniVerificacionSchema = z.object({
  dni: z
    .string()
    .trim()
    .min(1, MENSAJES_DNI.vacio)
    .regex(/^\d{8}$/, MENSAJES_DNI.formato),
});

export type DniVerificacionValues = z.infer<typeof dniVerificacionSchema>;
