/** Sin cuotas elegidas (W3 §8, propuesta). */
const SIN_SELECCION = '—';

/**
 * Lista de números de cuota para el resumen de pago (W3 §8, propuesta; la comparten W-04 a W-07):
 * 1 cuota → `8`; 2 → `8 y 9`; 3 o más → `8, 9 y 10`.
 */
export function formatearListaCuotas(numeros: ReadonlyArray<number>): string {
  if (numeros.length === 0) return SIN_SELECCION;
  if (numeros.length === 1) return String(numeros[0]);

  const ultimo = numeros[numeros.length - 1];
  return `${numeros.slice(0, -1).join(', ')} y ${ultimo}`;
}
