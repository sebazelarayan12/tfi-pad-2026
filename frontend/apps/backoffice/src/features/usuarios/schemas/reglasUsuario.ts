import type { UsuarioListItemMock } from '@nexa/api';

export const MOTIVO_CUENTA_PROPIA = 'No podés desactivar tu propia cuenta.';
export const MOTIVO_ULTIMO_ADMINISTRADOR = 'Debe quedar al menos un administrador activo.';

type UsuarioDeLista = Pick<UsuarioListItemMock, 'email' | 'rol' | 'activo'>;

/** El usuario de la fila es quien tiene la sesión abierta (se compara el email sin distinguir mayúsculas). */
export function esCuentaPropia(
  usuario: Pick<UsuarioListItemMock, 'email'>,
  emailSesion: string | null,
) {
  return emailSesion !== null && usuario.email.toLowerCase() === emailSesion.toLowerCase();
}

/** Es el único administrador activo: desactivarlo o pasarlo a Empleado dejaría el sistema sin administrador. */
export function esUltimoAdministradorActivo(
  usuario: UsuarioDeLista,
  usuarios: ReadonlyArray<UsuarioDeLista>,
) {
  if (usuario.rol !== 'Administrador' || !usuario.activo) return false;
  return usuarios.filter((u) => u.rol === 'Administrador' && u.activo).length === 1;
}

/** Motivo por el que la UI no deja desactivar al usuario, o `null` si se puede (D-B25-02). */
export function motivoBloqueoDesactivar(
  usuario: UsuarioDeLista,
  usuarios: ReadonlyArray<UsuarioDeLista>,
  emailSesion: string | null,
): string | null {
  if (!usuario.activo) return null;
  if (esCuentaPropia(usuario, emailSesion)) return MOTIVO_CUENTA_PROPIA;
  if (esUltimoAdministradorActivo(usuario, usuarios)) return MOTIVO_ULTIMO_ADMINISTRADOR;
  return null;
}
