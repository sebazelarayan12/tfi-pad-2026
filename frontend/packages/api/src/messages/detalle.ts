import type { ApiError } from '../client';
import type { ProblemDetails } from '../dto/comunes';

export const CODIGOS_EN_PREFIJO = ['VEHICULO_NO_ENCONTRADO'] as const;

type DetalleProblema =
  Pick<ProblemDetails, 'detail' | 'codigo'> | Pick<ApiError, 'detail' | 'codigo'>;

export function leerMensajeDetalle(problema: DetalleProblema): {
  codigo: string | null;
  mensaje: string;
} {
  let mensaje = problema.detail?.trim() ?? '';
  let codigo = problema.codigo ?? null;
  const prefijo = CODIGOS_EN_PREFIJO.find((valor) => mensaje.startsWith(`${valor}:`));
  if (prefijo) {
    codigo ??= prefijo;
    mensaje = mensaje.slice(prefijo.length + 1).trimStart();
  }
  mensaje = mensaje.replace(/^RN\d{2}:\s*/, '').trim();
  return { codigo, mensaje: mensaje || 'Ocurrió un error inesperado.' };
}
