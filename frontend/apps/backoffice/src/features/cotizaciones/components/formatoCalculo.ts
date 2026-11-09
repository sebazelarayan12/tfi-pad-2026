import { formatearImporte } from '@nexa/api';
import type { CalculoPrima } from '../types/calculo';

/** Conserva el formato es-AR y los dos decimales de T-09, sin el símbolo de moneda. */
export function formatoFactor(valor: number): string {
  return formatearImporte(valor).replace(/\$\s*/u, '');
}

export function formatoLinea(calculo: CalculoPrima): string {
  return [
    calculo.primaBase,
    calculo.factorTipo,
    calculo.factorAntiguedad,
    calculo.factorEdad,
    calculo.factorUso,
  ]
    .map(formatoFactor)
    .join(' x ');
}
