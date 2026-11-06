import { isApiError, leerMensajeDetalle } from '@nexa/api';

export const TEXTO_ERROR_RED =
  'No se pudo confirmar el cobro. Revisá el estado de las cuotas antes de intentar de nuevo.';
export const TEXTO_ERROR_GENERICO = 'Ocurrió un error inesperado.';
export const TEXTO_SIN_PERMISO = 'No tenés permiso para registrar pagos.';

function errorDeValidacionCuota(error: unknown): string | null {
  if (!isApiError(error) || error.errors === null) return null;
  const clave = Object.keys(error.errors).find((nombre) => nombre.toLowerCase() === 'cuotaids');
  return clave === undefined ? null : (error.errors[clave]?.[0] ?? null);
}

/** Traduce un fallo del cobro a un texto de UI, sin prefijos `RNxx:` (FC10). */
export function mensajeDeError(error: unknown): string {
  if (!isApiError(error)) return TEXTO_ERROR_GENERICO;
  if (error.kind === 'red' || error.status === 0) return TEXTO_ERROR_RED;
  if (error.status === 403) return TEXTO_SIN_PERMISO;

  const validacion = errorDeValidacionCuota(error);
  if (validacion !== null) return validacion;

  return leerMensajeDetalle(error).mensaje;
}

/**
 * Traduce un fallo de una consulta (pago o factura). A diferencia del cobro, una caída de red
 * no tiene un texto propio: se usa el genérico y, si el back manda `detail`, se muestra tal cual.
 */
export function mensajeDeErrorConsulta(error: unknown): string {
  if (!isApiError(error)) return TEXTO_ERROR_GENERICO;
  return leerMensajeDetalle(error).mensaje;
}
