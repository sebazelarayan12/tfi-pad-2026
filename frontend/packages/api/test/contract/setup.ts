import { afterAll, afterEach, beforeAll } from 'vitest';

import { servidorMock } from '../../mocks/server';

/**
 * Configuración de los tests de contrato.
 *
 * - `CONTRACT_TARGET=mock` (por defecto): MSW responde, sin back.
 * - `CONTRACT_TARGET=real`: se llama a `VITE_API_BASE_URL`. Exige esa variable; si
 *   falta, la suite falla al iniciar (no se salta).
 * - `CONTRACT_ALLOW_WRITES=true`: permite en modo real los endpoints destructivos.
 * - `CONTRACT_EMAIL` y `CONTRACT_PASSWORD`: usuario de prueba para los endpoints
 *   con sesión en modo real. Solo variables de entorno; nunca valores en el repo.
 *
 * Dueño: US-FE-T-23.
 */

export type ObjetivoContrato = 'mock' | 'real';

export interface ConfiguracionContrato {
  objetivo: ObjetivoContrato;
  /** Origen del back (sin `/api`). En modo mock es un host ficticio. */
  baseUrl: string;
  permitirEscrituras: boolean;
}

type Entorno = Record<string, string | undefined>;

/** Host ficticio: los handlers de MSW usan `*` como origen. */
export const BASE_URL_MOCK = 'https://api.test';

const TOKEN_MOCK = 'token-mock-contrato';

/** Token de la sesión del modo actual; vive solo en memoria. */
let tokenSesion: string | null = null;

/**
 * Lee y valida la configuración. Lanza con un mensaje que nombra la variable
 * que falta o el valor inválido.
 */
export function leerConfiguracion(env: Entorno = process.env): ConfiguracionContrato {
  const objetivo = env.CONTRACT_TARGET ?? 'mock';
  if (objetivo !== 'mock' && objetivo !== 'real') {
    throw new Error(`CONTRACT_TARGET debe ser "mock" o "real" (recibido: "${objetivo}").`);
  }

  if (objetivo === 'mock') {
    return { objetivo, baseUrl: BASE_URL_MOCK, permitirEscrituras: true };
  }

  const baseUrl = env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '');
  if (!baseUrl) {
    throw new Error(
      'Falta VITE_API_BASE_URL: el modo real (CONTRACT_TARGET=real) necesita el origen del back, por ejemplo http://localhost:8080.',
    );
  }
  return { objetivo, baseUrl, permitirEscrituras: env.CONTRACT_ALLOW_WRITES === 'true' };
}

function exigirVariable(env: Entorno, nombre: 'CONTRACT_EMAIL' | 'CONTRACT_PASSWORD'): string {
  const valor = env[nombre];
  if (!valor) {
    throw new Error(
      `Falta ${nombre}: el modo real necesita un usuario de prueba para los endpoints con sesión.`,
    );
  }
  return valor;
}

/**
 * Deja lista la sesión para un endpoint con `requiereSesion`.
 * Mock: token ficticio. Real: `POST /api/auth/login` con las variables de entorno.
 */
export async function asegurarSesion(env: Entorno = process.env): Promise<void> {
  const configuracion = leerConfiguracion(env);
  if (configuracion.objetivo === 'mock') {
    tokenSesion = TOKEN_MOCK;
    return;
  }
  if (tokenSesion !== null) return;

  const email = exigirVariable(env, 'CONTRACT_EMAIL');
  const password = exigirVariable(env, 'CONTRACT_PASSWORD');
  const respuesta = await fetch(`${configuracion.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!respuesta.ok) {
    throw new Error(
      `El login del modo real respondió ${respuesta.status}; revisar CONTRACT_EMAIL y CONTRACT_PASSWORD.`,
    );
  }
  const cuerpo: unknown = await respuesta.json();
  const token =
    typeof cuerpo === 'object' && cuerpo !== null && 'token' in cuerpo
      ? (cuerpo as { token: unknown }).token
      : undefined;
  if (typeof token !== 'string' || token === '') {
    throw new Error('El login del modo real no devolvió un token.');
  }
  tokenSesion = token;
}

export interface OpcionesContrato extends RequestInit {
  /** Envía `Authorization: Bearer` con la sesión de `asegurarSesion`. */
  conSesion?: boolean;
}

/**
 * `fetch` contra el objetivo configurado. Lo usan los `request` de cada endpoint:
 * devuelve la respuesta cruda, sin pasar por `ApiError`.
 */
export function fetchContrato(ruta: string, opciones: OpcionesContrato = {}): Promise<Response> {
  const { conSesion = false, headers, ...resto } = opciones;
  const configuracion = leerConfiguracion();
  const cabeceras = new Headers(headers);
  if (conSesion && tokenSesion !== null) {
    cabeceras.set('Authorization', `Bearer ${tokenSesion}`);
  }
  return fetch(`${configuracion.baseUrl}${ruta}`, { ...resto, headers: cabeceras });
}

let instalado = false;

/**
 * Registra los hooks de MSW en modo mock y valida la configuración al iniciar.
 * Es idempotente: el harness la llama al importarse.
 */
export function instalarSetupContrato(): void {
  if (instalado) return;
  instalado = true;

  beforeAll(() => {
    const { objetivo } = leerConfiguracion();
    if (objetivo === 'mock') servidorMock.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => {
    if (leerConfiguracion().objetivo === 'mock') servidorMock.resetHandlers();
  });
  afterAll(() => {
    if (leerConfiguracion().objetivo === 'mock') servidorMock.close();
  });
}
