import type { RolUsuario } from '@nexa/api';
import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

import { useRol } from '../../features/auth';

interface RequireRolProps {
  roles: ReadonlyArray<RolUsuario>;
  /** Sin `children` se usa como ruta de layout y renderiza `<Outlet />`. */
  children?: ReactNode;
}

/** Sin el rol requerido muestra el panel de falta de permiso y no renderiza hijos (DP-2). */
export function RequireRol({ roles, children }: RequireRolProps) {
  const rol = useRol();

  if (rol === null || !roles.includes(rol)) {
    return <p className="p-sp-24 text-text-primary">No tenés permiso para esta acción.</p>;
  }
  return children ?? <Outlet />;
}
