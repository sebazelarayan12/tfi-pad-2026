import type { ReactNode } from 'react';

interface RequireRolProps {
  children?: ReactNode;
}

// Stub de US-FE-T-14: lo reemplaza US-FE-T-13 con el chequeo real de rol.
export function RequireRol({ children }: RequireRolProps) {
  return <>{children}</>;
}
