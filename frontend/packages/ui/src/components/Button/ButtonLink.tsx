import type { ReactNode } from 'react';

import { renderAnchor, type RenderLink } from './enlace';
import { clasesButton, type ButtonSize, type ButtonVariant } from './estilos';

export interface ButtonLinkProps {
  label: string;
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Decorativo: el nombre accesible es siempre `label`. */
  icon?: ReactNode;
  /** Enlace del router de la app; por defecto `<a href>`. */
  renderLink?: RenderLink;
}

/** Enlace con el aspecto de `Button` (`design-system §5.1`), para acciones que navegan. */
export function ButtonLink({
  label,
  href,
  variant = 'primary',
  size = 'm',
  icon,
  renderLink = renderAnchor,
}: ButtonLinkProps) {
  return (
    <>
      {renderLink({
        href,
        className: clasesButton(variant, size),
        children: (
          <>
            {icon ? (
              <span aria-hidden="true" className="inline-flex">
                {icon}
              </span>
            ) : null}
            {label}
          </>
        ),
      })}
    </>
  );
}
