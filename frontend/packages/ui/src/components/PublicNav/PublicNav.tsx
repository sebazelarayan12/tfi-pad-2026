import { ListIcon } from '@phosphor-icons/react/dist/csr/List';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { useEffect, useId, useRef, useState } from 'react';

import { renderAnchor, type RenderLink } from '../Button/enlace';
import { LogoNexa } from '../LogoNexa/LogoNexa';

export interface PublicNavLink {
  label: string;
  href: string;
}

export interface PublicNavProps {
  links: ReadonlyArray<PublicNavLink>;
  ctaLabel: string;
  ctaHref: string;
  /** Destino del logo (default `/`, W1 §8). */
  logoHref?: string;
  /**
   * Enlace del router de la app para el logo y el CTA, que navegan entre páginas sin recargar.
   * Los `links` son anclas de la página y quedan como `<a href>`. Por defecto `<a href>`.
   */
  renderLink?: RenderLink;
}

// Textos del botón mobile: NO DEFINIDOS en el Figma, default de la ficha (T-18 §13.2).
const ABRIR_MENU = 'Abrir menú';
const CERRAR_MENU = 'Cerrar menú';

const FOCO =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary';
const LINK = `inline-flex min-h-11 items-center rounded-input text-body text-text-secondary ${FOCO}`;
const CTA = `inline-flex h-10 items-center justify-center rounded-pill bg-action-primary px-sp-16 text-body text-action-on-primary ${FOCO}`;

/** Barra superior de la web pública, 72 px (`design-system §5.10`). */
export function PublicNav({
  links,
  ctaLabel,
  ctaHref,
  logoHref = '/',
  renderLink = renderAnchor,
}: PublicNavProps) {
  const [abierto, setAbierto] = useState(false);
  const botonRef = useRef<HTMLButtonElement>(null);
  const idMenu = useId();

  // Escape cierra el menú mobile y devuelve el foco al botón (T-18 §13.2).
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key !== 'Escape') return;
      setAbierto(false);
      botonRef.current?.focus();
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [abierto]);

  return (
    <header>
      <div className="flex h-[72px] items-center gap-sp-32 px-sp-24">
        {renderLink({ href: logoHref, className: `rounded-input ${FOCO}`, children: <LogoNexa /> })}
        <div className="flex-1" />
        <nav aria-label="Principal" className="hidden items-center gap-sp-32 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className={LINK}>
              {link.label}
            </a>
          ))}
        </nav>
        {renderLink({
          href: ctaHref,
          className: `hidden md:inline-flex ${CTA}`,
          children: ctaLabel,
        })}
        <button
          ref={botonRef}
          type="button"
          aria-label={abierto ? CERRAR_MENU : ABRIR_MENU}
          aria-expanded={abierto}
          aria-controls={idMenu}
          onClick={() => setAbierto((valor) => !valor)}
          className={`inline-flex size-11 items-center justify-center rounded-pill text-text-primary md:hidden ${FOCO}`}
        >
          <span aria-hidden="true" className="inline-flex">
            {abierto ? (
              <XIcon size={20} weight="regular" />
            ) : (
              <ListIcon size={20} weight="regular" />
            )}
          </span>
        </button>
      </div>
      {abierto ? (
        <nav
          id={idMenu}
          aria-label="Principal (móvil)"
          className="flex flex-col gap-sp-4 px-sp-24 pb-sp-16 md:hidden"
        >
          {links.map((link) => (
            <a key={link.href} href={link.href} className={LINK}>
              {link.label}
            </a>
          ))}
          {renderLink({
            href: ctaHref,
            className: `mt-sp-8 ${CTA}`,
            onClick: () => setAbierto(false),
            children: ctaLabel,
          })}
        </nav>
      ) : null}
    </header>
  );
}
