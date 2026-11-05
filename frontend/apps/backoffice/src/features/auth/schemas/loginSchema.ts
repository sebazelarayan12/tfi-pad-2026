import { z } from 'zod';

export const MENSAJES_LOGIN = {
  emailObligatorio: 'El email es obligatorio.',
  emailInvalido: 'El email no tiene un formato válido.',
  passwordObligatoria: 'La contraseña es obligatoria.',
} as const;

/** Validación del formulario de login (B1 §6). El email se recorta antes de validar y de enviar. */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, MENSAJES_LOGIN.emailObligatorio)
    .pipe(z.email(MENSAJES_LOGIN.emailInvalido)),
  password: z.string().min(1, MENSAJES_LOGIN.passwordObligatoria),
});

export type LoginFormValues = z.input<typeof loginSchema>;
export type LoginPayload = z.output<typeof loginSchema>;
