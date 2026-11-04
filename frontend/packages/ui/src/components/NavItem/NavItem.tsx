import type { ReactNode } from 'react';

import { NAV_ICONOS, type NavIcon } from './iconos';

export interface NavItemLinkProps {
  className: string;
  'aria-current'?: 'page';
  children: ReactNode;
}

export interface NavItemProps {
  label: string;
  icon: NavIcon;
  active?: boolean;
  /** Sin `href` el ítem no es interactivo (DP-1). */
  href?: string;
  /** Enlace del router de la app; por defecto `<a href>` (DP-2). */
  renderLink?: (props: NavItemLinkProps) => ReactNode;
}

const FOCO =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary';
const BASE = 'flex h-8 w-full items-center gap-sp-8 rounded-input pr-sp-8 text-body-sm';

/** Ítem de navegación con estados Activo e Inactivo (`design-system §5.6`). */
export function NavItem({ label, icon, active = false, href, renderLink }: NavItemProps) {
  const Icono = NAV_ICONOS[icon];
  const color = active ? 'text-text-primary' : 'text-text-secondary';
  const contenido = (
    <>
      <span
        data-indicador=""
        aria-hidden="true"
        className={`h-5 w-0.5 shrink-0 rounded-pill ${active ? 'bg-action-primary' : 'bg-transparent'}`}
      />
      <span aria-hidden="true" className="inline-flex shrink-0">
        <Icono size={16} weight="regular" />
      </span>
      <span className="truncate">{label}</span>
    </>
  );

  if (!href) {
    return (
      <span aria-disabled="true" className={`${BASE} ${color}`}>
        {contenido}
      </span>
    );
  }

  const className = `${BASE} ${color} ${FOCO}`;
  const ariaCurrent = active ? ('page' as const) : undefined;

  if (renderLink) {
    return <>{renderLink({ className, 'aria-current': ariaCurrent, children: contenido })}</>;
  }

  return (
    <a href={href} aria-current={ariaCurrent} className={className}>
      {contenido}
    </a>
  );
}
