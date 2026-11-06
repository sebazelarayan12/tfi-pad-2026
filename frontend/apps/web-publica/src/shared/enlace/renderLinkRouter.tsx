import type { LinkRenderProps } from '@nexa/ui';
import { Link } from 'react-router-dom';

/** `renderLink` de `@nexa/ui` con el `Link` de React Router: navega sin recargar la página. */
export function renderLinkRouter({ href, className, onClick, children }: LinkRenderProps) {
  return (
    <Link to={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
