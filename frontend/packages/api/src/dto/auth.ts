/**
 * Tipos de `/api/auth/*`.
 * Convenciones: `contratos-api/convenciones-transversales.md` §2.1 y
 * `contratos-api/seguridad-clientes-publico.md` §2.2.
 *
 * Dueño: US-FE-T-12 (solo tipos). Las funciones de request son de US-FE-T-32
 * (`packages/api/src/auth/login.ts`, RV-D04).
 */

/** Roles asignables en el back (`Roles.cs`), en ese orden de privilegio. */
export type RolUsuario = 'Administrador' | 'Empleado';

/** `POST /api/auth/login` (implementado). */
export interface LoginRequest {
  email: string;
  password: string;
}

/** 200 de `POST /api/auth/login`. El `token` va en `Authorization: Bearer`. */
export interface LoginResponse {
  /** JWT. */
  token: string;
  rol: RolUsuario;
  /** ISO 8601 con offset `+00:00`. No convertir a `Date` en el tipo. */
  expiraEn: string;
}
