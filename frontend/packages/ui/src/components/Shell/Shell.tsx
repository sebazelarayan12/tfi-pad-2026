import type { ReactNode } from 'react';

export interface ShellProps {
  children: ReactNode;
  /** Clases de layout que suma la app (por ejemplo, que el Shell ocupe el alto disponible). */
  className?: string;
}

/**
 * Contenedor blanco flotante (`design-system §3.4, §5.15`, RV-D06). Única sombra del
 * sistema; el inset y el ancho los decide cada app.
 */
export function Shell({ children, className }: ShellProps) {
  const base = 'rounded-shell bg-surface-panel shadow-shell';
  return <div className={className ? `${base} ${className}` : base}>{children}</div>;
}
