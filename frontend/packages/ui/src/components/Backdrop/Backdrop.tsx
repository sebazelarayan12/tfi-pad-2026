import type { ReactNode } from 'react';

export interface BackdropProps {
  children?: ReactNode;
}

/** Fondo degradado de pantalla completa (`design-system §5.14`), sin alto fijo. */
export function Backdrop({ children }: BackdropProps) {
  return <div className="min-h-dvh bg-backdrop">{children}</div>;
}
