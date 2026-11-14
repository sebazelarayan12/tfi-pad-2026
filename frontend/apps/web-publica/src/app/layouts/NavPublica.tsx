import { ListIcon } from '@phosphor-icons/react/dist/csr/List';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { LogoMarca } from '../../marca/LogoMarca';
import { BOTON_MARINO, CONTENEDOR, FOCO } from '../../marca/estilos';
import { InterruptorTema } from '../../marca/tema/InterruptorTema';

export interface LinkNav {
  label: string;
  href: string;
}

interface NavPublicaProps {
  links: ReadonlyArray<LinkNav>;
  ctaLabel: string;
  ctaHref: string;
}

const ABRIR_MENU = 'Abrir menú';
const CERRAR_MENU = 'Cerrar menú';
const ETIQUETA_TEMA = 'Modo oscuro';

const LINK = `inline-flex min-h-11 items-center rounded-input px-sp-4 text-body font-medium text-tema-titulo hover:text-tema-acento ${FOCO}`;

/**
 * Barra superior de la web pública: fija, con borde fino abajo, logo a la izquierda, links, el CTA
 * en marino y el interruptor de modo claro/oscuro a la derecha (en celular, dentro del menú) (en oscuro la barra queda marina,
 * el CTA blanco y el logo en su versión blanca). El azul queda para la acción principal de cada página.
 */
export function NavPublica({ links, ctaLabel, ctaHref }: NavPublicaProps) {
  const [abierto, setAbierto] = useState(false);
  const botonRef = useRef<HTMLButtonElement>(null);
  const idMenu = useId();
  const cerrar = () => setAbierto(false);

  // Escape cierra el menú mobile y devuelve el foco al botón.
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
    <header className="sticky top-0 z-30 border-b border-border-hairline bg-tema-fondo">
      <div className={`${CONTENEDOR} flex h-16 items-center gap-sp-32 md:h-[72px]`}>
        <Link to="/" className={`rounded-input ${FOCO}`} onClick={cerrar}>
          <LogoMarca className="h-8 w-auto md:h-10" />
        </Link>
        <div className="flex-1" />
        <nav aria-label="Principal" className="hidden items-center gap-sp-24 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className={LINK}>
              {link.label}
            </a>
          ))}
        </nav>
        <Link to={ctaHref} className={`hidden md:inline-flex ${BOTON_MARINO}`}>
          {ctaLabel}
        </Link>
        {/* En celular el interruptor vive dentro del menú desplegable. */}
        <div className="hidden md:block">
          <InterruptorTema />
        </div>
        <button
          ref={botonRef}
          type="button"
          aria-label={abierto ? CERRAR_MENU : ABRIR_MENU}
          aria-expanded={abierto}
          aria-controls={idMenu}
          onClick={() => setAbierto((valor) => !valor)}
          className={`inline-flex size-11 items-center justify-center rounded-pill text-tema-titulo md:hidden ${FOCO}`}
        >
          <span aria-hidden="true" className="inline-flex">
            {abierto ? <XIcon size={22} /> : <ListIcon size={22} />}
          </span>
        </button>
      </div>
      {abierto ? (
        <nav
          id={idMenu}
          aria-label="Principal (móvil)"
          className={`${CONTENEDOR} flex flex-col gap-sp-4 border-t border-border-hairline pb-sp-24 pt-sp-8 md:hidden`}
        >
          {links.map((link) => (
            <a key={link.href} href={link.href} className={LINK} onClick={cerrar}>
              {link.label}
            </a>
          ))}
          <div className="flex min-h-11 items-center justify-between gap-sp-16 px-sp-4">
            {/* El nombre accesible ya lo da el interruptor; este texto es solo visual. */}
            <span aria-hidden="true" className="text-body font-medium text-tema-titulo">
              {ETIQUETA_TEMA}
            </span>
            <InterruptorTema />
          </div>
          <Link to={ctaHref} className={`mt-sp-8 ${BOTON_MARINO}`} onClick={cerrar}>
            {ctaLabel}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
