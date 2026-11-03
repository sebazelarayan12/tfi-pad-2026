import type { Sesion } from '../types/sesion';

/** No se usa un token que vence en menos de 5 s. */
export const MARGEN_EXPIRACION_MS = 5_000;

export function estaVigente(sesion: Sesion, ahoraMs: number): boolean {
  return ahoraMs < sesion.expiraEn.getTime() - MARGEN_EXPIRACION_MS;
}
