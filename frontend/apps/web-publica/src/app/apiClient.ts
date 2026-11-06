import { createApiClient } from '@nexa/api';

/** Origen de la API en desarrollo (`.env.example`) cuando `VITE_API_BASE_URL` no está definida. */
const BASE_URL_POR_DEFECTO = 'http://localhost:8080';

/** Cliente HTTP de la web pública (FC18). La web no tiene sesión: no manda `Authorization`. */
export const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL || BASE_URL_POR_DEFECTO,
});
