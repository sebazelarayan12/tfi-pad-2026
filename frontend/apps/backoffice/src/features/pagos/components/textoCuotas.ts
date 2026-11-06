import { TEXTO_SIN_DATO } from '@nexa/api';

/**
 * Números de cuota de un pago (B11 §8, propuesta): `8`, `8 y 9`, `8, 9 y 10`.
 * Sin cuotas devuelve el texto de dato faltante.
 */
export function textoCuotas(numeros: ReadonlyArray<number>): string {
  if (numeros.length === 0) return TEXTO_SIN_DATO;
  if (numeros.length === 1) return String(numeros[0]);
  return `${numeros.slice(0, -1).join(', ')} y ${numeros[numeros.length - 1]}`;
}
