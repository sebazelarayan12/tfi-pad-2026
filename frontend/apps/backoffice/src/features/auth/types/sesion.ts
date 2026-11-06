import type { RolUsuario } from '@nexa/api';

export interface Sesion {
  token: string;
  rol: RolUsuario;
  expiraEn: Date;
  /** Claim `email` del JWT, solo para mostrar. `null` si el token no lo trae. */
  email: string | null;
  /** US-F1-09: la cuenta usa la contraseña temporal y debe cambiarla antes de seguir. */
  debeCambiarPassword: boolean;
}
