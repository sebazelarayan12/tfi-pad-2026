import { createApiClient, type ApiClient } from '@nexa/api';
import type { NavigateOptions } from 'react-router-dom';

import {
  cerrarSesion,
  exigirCambioPassword,
  RUTA_CAMBIAR_PASSWORD,
  RUTA_LOGIN,
  sesionActual,
} from '../features/auth';
import { router } from './router';

/** Origen de la API en desarrollo (`.env.example`) cuando `VITE_API_BASE_URL` no está definida. */
const BASE_URL_POR_DEFECTO = 'http://localhost:8080';

interface OpcionesApiClientApp {
  baseUrl: string;
  navegar: (ruta: string, opciones: NavigateOptions) => unknown;
}

/**
 * Cliente HTTP de la app: manda el token de la sesión y, ante un `401` de un endpoint protegido,
 * cierra la sesión y lleva a `/login`. El cliente ya excluye el `401` de `/api/auth/login`.
 * El `403` no cierra la sesión; el `403 PASSWORD_CAMBIO_REQUERIDO` marca la sesión y lleva a
 * `/cambiar-password` (US-F1-09, US-FE-B-26).
 */
export function crearApiClientApp({ baseUrl, navegar }: OpcionesApiClientApp): ApiClient {
  return createApiClient({
    baseUrl,
    getToken: () => sesionActual()?.token ?? null,
    onUnauthorized: () => {
      cerrarSesion('no-autorizada');
      void navegar(RUTA_LOGIN, { replace: true });
    },
    onPasswordChangeRequired: () => {
      exigirCambioPassword();
      void navegar(RUTA_CAMBIAR_PASSWORD, { replace: true });
    },
  });
}

export const apiClient = crearApiClientApp({
  baseUrl: import.meta.env.VITE_API_BASE_URL || BASE_URL_POR_DEFECTO,
  navegar: (ruta, opciones) => router.navigate(ruta, opciones),
});
