import { z } from 'zod';

import { MENSAJES_USUARIO, ROLES_ASIGNABLES } from './crearUsuarioSchema';

/** Edición de un usuario: el email no se edita y no hay contraseña (B-25 §2). */
export const editarUsuarioSchema = z.object({
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
  rol: z.enum(ROLES_ASIGNABLES, { error: MENSAJES_USUARIO.rolObligatorio }),
});

export type EditarUsuarioPayload = z.output<typeof editarUsuarioSchema>;
