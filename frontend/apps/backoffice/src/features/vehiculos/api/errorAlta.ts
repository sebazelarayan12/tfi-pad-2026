import { ApiError, leerMensajeDetalle } from '@nexa/api';
import { MENSAJE_PATENTE_INVALIDA } from '../schemas/vehiculoAltaSchema';

const ERROR_GENERAL = 'No se pudo completar la operación. Intentá de nuevo.';

export function mensajeErrorVehiculo(error: unknown): string {
  return error instanceof ApiError && error.detail?.trim()
    ? leerMensajeDetalle(error).mensaje
    : ERROR_GENERAL;
}

export function errorAlta(error: unknown): { campo?: 'patente'; mensaje: string } {
  if (
    error instanceof ApiError &&
    error.status === 400 &&
    (error.errors?.patente?.length || error.errors?.Patente?.length)
  ) {
    return { campo: 'patente', mensaje: MENSAJE_PATENTE_INVALIDA };
  }
  return { mensaje: mensajeErrorVehiculo(error) };
}
