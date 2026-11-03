import { WarningCircleIcon } from '@phosphor-icons/react/dist/csr/WarningCircle';
import type { ReactNode } from 'react';

export interface AlertaErrorProps {
  /** El mensaje lo define cada pantalla (FB7.6); el componente no tiene textos propios. */
  children: ReactNode;
}

/**
 * Caja de error con `role="alert"` (B1 §3, D-T07-2). La pantalla la monta en el momento
 * del error para que se anuncie; no dejarla montada vacía.
 */
export function AlertaError({ children }: AlertaErrorProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-sp-12 rounded-card bg-status-cancelada-bg px-sp-16 py-sp-12 text-body-sm text-status-cancelada-text"
    >
      <span aria-hidden="true" className="shrink-0">
        <WarningCircleIcon size={20} weight="regular" />
      </span>
      <p>{children}</p>
    </div>
  );
}
