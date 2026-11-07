import type { ReactNode } from 'react';

import { ETIQUETA_ACCIONES } from '../textosDetalle';

/**
 * Slot de la barra de acciones. B-16 agrega los botones (Registrar pago en caja, Cupón Pago Fácil
 * y Cancelar póliza) como `children`; esta tarea no renderiza ninguno.
 */
export function PolizaAcciones({ children }: { children?: ReactNode }) {
  return (
    <div role="group" aria-label={ETIQUETA_ACCIONES} className="flex flex-wrap gap-sp-8 empty:hidden">
      {children}
    </div>
  );
}
