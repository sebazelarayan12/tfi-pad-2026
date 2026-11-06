import { z } from 'zod';

export const LONGITUD_MINIMA_PASSWORD = 12;

/** Requisitos de la contraseña fuerte (D-B26-03). Debe coincidir con la política del back (US-F1-09). */
export const REQUISITOS_PASSWORD = [
  {
    id: 'longitud',
    texto: `Al menos ${LONGITUD_MINIMA_PASSWORD} caracteres`,
    mensaje: `Usá al menos ${LONGITUD_MINIMA_PASSWORD} caracteres.`,
    cumple: (valor: string) => valor.length >= LONGITUD_MINIMA_PASSWORD,
  },
  {
    id: 'mayuscula',
    texto: 'Una mayúscula',
    mensaje: 'Agregá una mayúscula.',
    cumple: (valor: string) => /[A-Z]/.test(valor),
  },
  {
    id: 'minuscula',
    texto: 'Una minúscula',
    mensaje: 'Agregá una minúscula.',
    cumple: (valor: string) => /[a-z]/.test(valor),
  },
  {
    id: 'numero',
    texto: 'Un número',
    mensaje: 'Agregá un número.',
    cumple: (valor: string) => /\d/.test(valor),
  },
  {
    id: 'simbolo',
    texto: 'Un símbolo',
    mensaje: 'Agregá un símbolo.',
    cumple: (valor: string) => /[^A-Za-z0-9]/.test(valor),
  },
] as const;

export const MENSAJES_CAMBIO_PASSWORD = {
  actualObligatoria: 'Ingresá la contraseña temporal.',
  repetirObligatoria: 'Repetí la contraseña nueva.',
  noCoinciden: 'Las contraseñas no coinciden.',
  igualALaTemporal: 'La contraseña nueva debe ser distinta de la temporal.',
} as const;

/** Ninguna contraseña se recorta: los espacios cuentan. */
export const cambiarPasswordSchema = z
  .object({
    passwordActual: z.string().min(1, MENSAJES_CAMBIO_PASSWORD.actualObligatoria),
    passwordNueva: z.string().superRefine((valor, contexto) => {
      const incumplido = REQUISITOS_PASSWORD.find((requisito) => !requisito.cumple(valor));
      if (incumplido) contexto.addIssue({ code: 'custom', message: incumplido.mensaje });
    }),
    repetir: z.string().min(1, MENSAJES_CAMBIO_PASSWORD.repetirObligatoria),
  })
  .refine((valores) => valores.passwordNueva === valores.repetir, {
    path: ['repetir'],
    message: MENSAJES_CAMBIO_PASSWORD.noCoinciden,
  })
  .refine((valores) => valores.passwordNueva !== valores.passwordActual, {
    path: ['passwordNueva'],
    message: MENSAJES_CAMBIO_PASSWORD.igualALaTemporal,
  });

export type CambiarPasswordFormValues = z.input<typeof cambiarPasswordSchema>;
export type CambiarPasswordPayload = { passwordActual: string; passwordNueva: string };
