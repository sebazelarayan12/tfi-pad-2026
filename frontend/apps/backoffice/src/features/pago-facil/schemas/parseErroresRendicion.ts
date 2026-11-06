import { isApiError } from '@nexa/api';
import type { ResultadoSubida } from '../types/rendicion';

const PREFIJO = 'El archivo de rendición tiene líneas mal formadas: ';
const ERROR_INESPERADO = 'Ocurrió un error inesperado.';

export function parseLineasMalFormadas(detail: string): string[] | null {
  return detail.startsWith(PREFIJO) ? detail.slice(PREFIJO.length).split('; ') : null;
}

export function resultadoErrorRendicion(error: unknown): ResultadoSubida {
  if (!isApiError(error)) return { tipo: 'error', mensaje: ERROR_INESPERADO };
  if (error.status === 401) return { tipo: 'ninguno' };
  if (error.status === 403) {
    return { tipo: 'error', mensaje: 'No tenés permiso para subir rendiciones.' };
  }
  if (error.kind === 'red') {
    return {
      tipo: 'error',
      mensaje: 'No se pudo conectar. Revisá la conexión y volvé a intentar.',
    };
  }

  const mensaje = error.detail || ERROR_INESPERADO;
  if (error.status === 400) {
    const errorArchivo = error.errors?.archivo?.[0];
    if (errorArchivo) return { tipo: 'error', mensaje: errorArchivo };
    const lineas = parseLineasMalFormadas(mensaje);
    if (lineas) return { tipo: 'error', mensaje: PREFIJO.trimEnd(), lineas };
    return { tipo: 'error', mensaje, duplicado: mensaje.endsWith(' ya fue procesado (RN18).') };
  }
  if (error.status >= 500) {
    return {
      tipo: 'error',
      mensaje,
      ayuda: 'Si el error se repite, subí el mismo contenido con otro nombre.',
    };
  }
  return { tipo: 'error', mensaje };
}
