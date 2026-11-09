import { isApiError } from '@nexa/api';

/** Textos de B4 §5 y §7; los marcados "propuesta" en la ficha de B-06 §8 no están en el diseño. */
export const TEXTOS_RENAPER = {
  titulo: 'Validación Renaper',
  inicial: 'Validá el DNI para ver los datos de Renaper.',
  nota: 'Los datos de Renaper reemplazan los cargados a mano.',
  noExiste: 'El DNI no existe en Renaper. Revisá el número e intentá de nuevo.',
  caido: 'Renaper no responde. Podés guardar el cliente y validarlo después.',
  fallecido: 'La persona figura como fallecida en Renaper.',
  dniFormato: 'El DNI debe tener 8 dígitos.',
  leyenda: 'Dato de Renaper',
  fechaSinGuardar: 'Sin guardar',
} as const;

const CODIGO_NO_ENCONTRADA = 'PERSONA_NO_ENCONTRADA';

export type ResultadoRenaper =
  | { tipo: 'inicial' }
  | { tipo: 'vigente' }
  | { tipo: 'fallecido' }
  | { tipo: 'no-existe' }
  | { tipo: 'formato' }
  | { tipo: 'caido' };

/**
 * Estado del rail a partir de la consulta. Un 404 sin `codigo` no es "no existe": se trata como
 * falla de la consulta y no marca el campo DNI (B-06 §9). Fallecido llega como 200 (B-06 §7).
 */
export function resultadoRenaper(
  persona: { estado: 'VIGENTE' | 'FALLECIDO' } | undefined,
  error: unknown,
): ResultadoRenaper {
  if (persona) return { tipo: persona.estado === 'FALLECIDO' ? 'fallecido' : 'vigente' };
  if (error === null || error === undefined) return { tipo: 'inicial' };
  if (isApiError(error) && error.kind === 'http') {
    if (error.status === 404 && error.codigo === CODIGO_NO_ENCONTRADA) return { tipo: 'no-existe' };
    if (error.status === 400) return { tipo: 'formato' };
  }
  return { tipo: 'caido' };
}

/** Texto del campo DNI cuando la consulta lo invalida, o `undefined`. */
export function mensajeDniRenaper(resultado: ResultadoRenaper): string | undefined {
  if (resultado.tipo === 'no-existe') return TEXTOS_RENAPER.noExiste;
  if (resultado.tipo === 'formato') return TEXTOS_RENAPER.dniFormato;
  return undefined;
}
