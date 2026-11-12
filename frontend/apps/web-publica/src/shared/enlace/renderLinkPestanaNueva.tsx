import type { LinkRenderProps } from '@nexa/ui';

/**
 * `renderLink` de `@nexa/ui` para un sitio externo en una pestaña nueva. Es un enlace que el usuario
 * toca (no `window.open` tras un `await`, que el navegador bloquea) y avisa que abre otra pestaña.
 */
export function renderLinkPestanaNueva({ href, className, onClick, children }: LinkRenderProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
    >
      {children} <span className="sr-only">(se abre en una pestaña nueva)</span>
    </a>
  );
}
