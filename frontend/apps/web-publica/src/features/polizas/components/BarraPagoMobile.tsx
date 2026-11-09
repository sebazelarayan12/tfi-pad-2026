import { formatearImporte } from '@nexa/api';
import { Button } from '@nexa/ui';

import { formatearListaCuotas } from '../../../shared/formato/listaCuotas';
import type { SeleccionCuotas } from '../hooks/useSeleccionCuotas';

interface BarraPagoMobileProps {
  seleccion: SeleccionCuotas;
  onPagar: () => void;
}

/** "Total a pagar", con las cuotas elegidas entre paréntesis (propuesta DN-W5-2). */
function etiquetaTotal(numeros: ReadonlyArray<number>): string {
  if (numeros.length === 0) return 'Total a pagar';
  const palabra = numeros.length === 1 ? 'cuota' : 'cuotas';
  return `Total a pagar (${palabra} ${formatearListaCuotas(numeros)})`;
}

/** Barra fija al pie con el total y "Pagar" (D-30, DN-W5-1). Va al final del DOM (DN-W5-4). */
export function BarraPagoMobile({ seleccion, onPagar }: BarraPagoMobileProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-sp-16 border-t border-border-hairline bg-surface-panel px-sp-16 py-sp-20">
      <div className="flex min-w-0 flex-col gap-sp-4">
        <span className="text-caption text-text-secondary">
          {etiquetaTotal(seleccion.numerosSeleccionados)}
        </span>
        <span aria-live="polite" className="font-mono text-mono-lg text-text-primary">
          {formatearImporte(seleccion.total)}
        </span>
      </div>
      <Button
        label="Pagar"
        size="m"
        disabled={seleccion.cantidadSeleccionadas === 0}
        onClick={onPagar}
      />
    </div>
  );
}
