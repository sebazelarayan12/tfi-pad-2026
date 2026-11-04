import type { ReactNode } from 'react';

export interface ShellProps {
  children: ReactNode;
}

/**
 * Contenedor blanco flotante (`design-system §3.4, §5.15`, RV-D06). Única sombra del
 * sistema; el inset y el ancho los decide cada app.
 */
export function Shell({ children }: ShellProps) {
  return <div className="rounded-shell bg-surface-panel shadow-shell">{children}</div>;
}
