import { z } from 'zod';

export const ROLES_ASIGNABLES = ['Administrador', 'Empleado'] as const;

export const MENSAJES_USUARIO = {
  nombreObligatorio: 'El nombre es obligatorio.',
  nombreLargo: 'El nombre no puede superar los 100 caracteres.',
  apellidoObligatorio: 'El apellido es obligatorio.',
  apellidoLargo: 'El apellido no puede superar los 100 caracteres.',
  emailObligatorio: 'El email es obligatorio.',
  emailInvalido: 'El email no tiene un formato válido.',
  emailLargo: 'El email no puede superar los 256 caracteres.',
  passwordObligatoria: 'La contraseña es obligatoria.',
  passwordRechazada: 'La contraseña no cumple la política de seguridad.',
  rolObligatorio: 'El rol es obligatorio.',
  rolInvalido: 'El rol debe ser Administrador o Empleado.',
} as const;

// Los mensajes son los del DTO del back (contrato §2.5). La política de contraseña la valida el back.
export const crearUsuarioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, MENSAJES_USUARIO.nombreObligatorio)
    .max(100, MENSAJES_USUARIO.nombreLargo),
  apellido: z
    .string()
    .trim()
    .min(1, MENSAJES_USUARIO.apellidoObligatorio)
    .max(100, MENSAJES_USUARIO.apellidoLargo),
  email: z
    .string()
    .trim()
    .min(1, MENSAJES_USUARIO.emailObligatorio)
    .email(MENSAJES_USUARIO.emailInvalido)
    .max(256, MENSAJES_USUARIO.emailLargo),
  // Sin trim: los espacios de la contraseña cuentan.
  password: z.string().min(1, MENSAJES_USUARIO.passwordObligatoria),
  rol: z.enum(ROLES_ASIGNABLES, { error: MENSAJES_USUARIO.rolObligatorio }),
});

export type CrearUsuarioPayload = z.output<typeof crearUsuarioSchema>;
