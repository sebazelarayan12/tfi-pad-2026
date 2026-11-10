import { z } from 'zod';

export const MENSAJES_REGISTRO_GRUPO = {
  emailObligatorio: 'El email es obligatorio.',
  emailInvalido: 'El email no tiene un formato válido.',
  passwordObligatoria: 'La contraseña es obligatoria.',
  passwordCorta: 'La contraseña debe tener al menos 12 caracteres.',
  passwordRequisitos: 'Incluí mayúscula, minúscula, número y símbolo.',
  confirmacionDistinta: 'Las contraseñas no coinciden.',
  nombreObligatorio: 'El nombre del grupo es obligatorio.',
  contactoObligatorio: 'El contacto es obligatorio.',
  descripcionObligatoria: 'Contá para qué vas a usar la API.',
} as const;

const LONGITUD_MINIMA_PASSWORD = 12;

const email = z
  .string()
  .trim()
  .min(1, MENSAJES_REGISTRO_GRUPO.emailObligatorio)
  .pipe(z.email(MENSAJES_REGISTRO_GRUPO.emailInvalido));

/** Misma política que las cuentas de empleados: 12+, mayúscula, minúscula, número y símbolo. */
export const registroGrupoSchema = z
  .object({
    nombre: z.string().trim().min(1, MENSAJES_REGISTRO_GRUPO.nombreObligatorio).max(100),
    contacto: z.string().trim().min(1, MENSAJES_REGISTRO_GRUPO.contactoObligatorio).max(100),
    email,
    descripcion: z.string().trim().min(1, MENSAJES_REGISTRO_GRUPO.descripcionObligatoria).max(500),
    password: z
      .string()
      .min(LONGITUD_MINIMA_PASSWORD, MENSAJES_REGISTRO_GRUPO.passwordCorta)
      .refine(
        (valor) =>
          /[A-Z]/.test(valor) &&
          /[a-z]/.test(valor) &&
          /\d/.test(valor) &&
          /[^A-Za-z0-9]/.test(valor),
        MENSAJES_REGISTRO_GRUPO.passwordRequisitos,
      ),
    confirmacion: z.string(),
  })
  .refine((valores) => valores.password === valores.confirmacion, {
    path: ['confirmacion'],
    message: MENSAJES_REGISTRO_GRUPO.confirmacionDistinta,
  });

export type RegistroGrupoValues = z.input<typeof registroGrupoSchema>;
export type RegistroGrupoPayload = z.output<typeof registroGrupoSchema>;

export const loginGrupoSchema = z.object({
  email,
  password: z.string().min(1, MENSAJES_REGISTRO_GRUPO.passwordObligatoria),
});

export type LoginGrupoValues = z.input<typeof loginGrupoSchema>;
export type LoginGrupoPayload = z.output<typeof loginGrupoSchema>;
