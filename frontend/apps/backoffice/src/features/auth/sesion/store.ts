import type { LoginResponse } from '@nexa/api';
import { useSyncExternalStore } from 'react';

import type { RolUsuario } from '@nexa/api';

import type { Sesion } from '../types/sesion';
import { borrar, guardar, leer } from './almacenamiento';
import { leerEmailDelToken } from './claims';
import { estaVigente, MARGEN_EXPIRACION_MS } from './vigencia';

export type MotivoCierre = 'manual' | 'expirada' | 'no-autorizada';

/** Máximo que acepta `setTimeout`: con más, se dispara de inmediato. */
const MAX_TIMEOUT_MS = 2_147_483_647;

let sesion: Sesion | null = null;
let temporizador: ReturnType<typeof setTimeout> | null = null;
const suscriptores = new Set<() => void>();
const callbacksDeCierre = new Set<() => void>();

function notificar(): void {
  suscriptores.forEach((suscriptor) => suscriptor());
}

function cancelarTemporizador(): void {
  if (temporizador !== null) clearTimeout(temporizador);
  temporizador = null;
}

function programarVencimiento(actual: Sesion, ahoraMs: number): void {
  cancelarTemporizador();
  const falta = actual.expiraEn.getTime() - MARGEN_EXPIRACION_MS - ahoraMs;
  const espera = Math.min(Math.max(falta, 0), MAX_TIMEOUT_MS);
  temporizador = setTimeout(() => cerrarSesion('expirada'), espera);
}

/**
 * Guarda la sesión del `LoginResponse`. Devuelve `false` (sin guardar nada) si `expiraEn`
 * no es una fecha válida o si la sesión ya no está vigente.
 */
export function iniciarSesion(respuesta: LoginResponse, ahoraMs: number = Date.now()): boolean {
  const expiraEn = new Date(respuesta.expiraEn);
  if (Number.isNaN(expiraEn.getTime())) return false;
  const nueva: Sesion = {
    token: respuesta.token,
    rol: respuesta.rol,
    expiraEn,
    email: leerEmailDelToken(respuesta.token),
  };
  if (!estaVigente(nueva, ahoraMs)) return false;
  sesion = nueva;
  guardar(nueva);
  programarVencimiento(nueva, ahoraMs);
  notificar();
  return true;
}

/** Cierra la sesión. Es idempotente: sin sesión abierta no hace nada. */
export function cerrarSesion(_motivo: MotivoCierre): void {
  if (sesion === null) return;
  sesion = null;
  cancelarTemporizador();
  borrar();
  callbacksDeCierre.forEach((callback) => {
    try {
      callback();
    } catch {
      // Un callback roto no debe impedir cerrar la sesión ni correr los demás.
    }
  });
  notificar();
}

export function sesionActual(): Sesion | null {
  return sesion;
}

/** Registra un callback que corre al cerrar sesión. Devuelve la función para desregistrarlo. */
export function alCerrarSesion(callback: () => void): () => void {
  callbacksDeCierre.add(callback);
  return () => {
    callbacksDeCierre.delete(callback);
  };
}

function suscribir(suscriptor: () => void): () => void {
  suscriptores.add(suscriptor);
  return () => {
    suscriptores.delete(suscriptor);
  };
}

export function useSesion(): Sesion | null {
  return useSyncExternalStore(suscribir, sesionActual);
}

export function useRol(): RolUsuario | null {
  return useSesion()?.rol ?? null;
}

/** Selector del email para el saludo de B-02. */
export function emailSesion(actual: Sesion | null): string | null {
  return actual?.email ?? null;
}

const restaurada = leer(Date.now());
if (restaurada !== null) {
  sesion = restaurada;
  programarVencimiento(restaurada, Date.now());
}
