import { isApiError, leerMensajeDetalle } from '@nexa/api';

export const CLIENTE_NO_ENCONTRADO = 'Cliente no encontrado.';

export function mensajeMutacionCliente(error: unknown, fallback: string) {
  if (!isApiError(error)) return fallback;
  if (error.status === 404) return CLIENTE_NO_ENCONTRADO;
  if (error.status === 400 && error.detail?.trim()) {
    return leerMensajeDetalle(error).mensaje || fallback;
  }
  return fallback;
}
