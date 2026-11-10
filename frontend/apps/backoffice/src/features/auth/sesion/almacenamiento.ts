import type { RolSesion } from '@nexa/api';

import type { Sesion } from '../types/sesion';
import { estaVigente } from './vigencia';

export const CLAVE_SESION = 'nexa.backoffice.sesion';

const ROLES: ReadonlyArray<RolSesion> = ['Administrador', 'Empleado', 'Grupo'];

/** Ninguna función de este archivo lanza: `sessionStorage` puede no estar disponible (FC12). */
export function guardar(sesion: Sesion): void {
  try {
    sessionStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({ ...sesion, expiraEn: sesion.expiraEn.toISOString() }),
    );
  } catch {
    // Sin storage la sesión vive solo en memoria.
  }
}

export function borrar(): void {
  try {
    sessionStorage.removeItem(CLAVE_SESION);
  } catch {
    // Nada que hacer: no hay storage.
  }
}

function esRol(valor: unknown): valor is RolSesion {
  return ROLES.some((rol) => rol === valor);
}

function parsear(texto: string): Sesion | null {
  const datos: unknown = JSON.parse(texto);
  if (typeof datos !== 'object' || datos === null) return null;
  const { token, rol, expiraEn, email, debeCambiarPassword } = datos as Record<string, unknown>;
  if (typeof token !== 'string' || token === '' || !esRol(rol)) return null;
  if (typeof expiraEn !== 'string') return null;
  const vencimiento = new Date(expiraEn);
  if (Number.isNaN(vencimiento.getTime())) return null;
  if (email !== null && typeof email !== 'string') return null;
  return { token, rol, expiraEn: vencimiento, email, debeCambiarPassword: debeCambiarPassword === true };
}

/** Devuelve la sesión guardada si es válida y vigente; si no, la borra y devuelve `null`. */
export function leer(ahoraMs: number): Sesion | null {
  let sesion: Sesion | null = null;
  try {
    const texto = sessionStorage.getItem(CLAVE_SESION);
    if (texto === null) return null;
    sesion = parsear(texto);
  } catch {
    sesion = null;
  }
  if (sesion !== null && estaVigente(sesion, ahoraMs)) return sesion;
  borrar();
  return null;
}
