import type { CalculoPrima } from '../types/calculo';
import { formatoLinea } from './formatoCalculo';

export function LineaCalculo({ calculo }: { calculo?: CalculoPrima | undefined }) {
  if (!calculo) return null;
  return (
    <span className="break-words font-mono text-body-sm text-text-secondary">
      {formatoLinea(calculo)}
    </span>
  );
}
