import type { ReactNode } from 'react';

/** Props que recibe `renderLink`: el componente ya armó el contenido y las clases. */
export interface LinkRenderProps {
  href: string;
  className: string;
  onClick?: () => void;
  children: ReactNode;
}

/**
 * Enlace del router de la app (por ejemplo `Link` de React Router), para navegar sin recargar.
 * `@nexa/ui` no depende del router: sin `renderLink`, los componentes usan `<a href>`.
 */
export type RenderLink = (props: LinkRenderProps) => ReactNode;

/** `<a href>` por defecto cuando la app no pasa `renderLink`. */
export function renderAnchor({ href, className, onClick, children }: LinkRenderProps): ReactNode {
  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
