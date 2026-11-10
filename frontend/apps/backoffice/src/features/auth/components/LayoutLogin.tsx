import '@fontsource/plus-jakarta-sans/800.css';
import type { ReactNode } from 'react';

interface LayoutLoginProps {
  children: ReactNode;
}

const NOMBRE = 'Nexa Seguros';
const TITULO_PANEL = 'Panel interno de Nexa Seguros';
const BAJADA_PANEL = 'Clientes, pólizas, cuotas y cobros en un solo lugar.';

/**
 * Layout del login (B1): pantalla oscura a pantalla completa, con una foto de auto que se funde
 * hacia el panel del formulario. A la izquierda va la marca en grande y, debajo, las frases del
 * panel. Solo escritorio: el login del backoffice no es responsive. El resto de las pantallas de
 * acceso siguen con `LayoutAcceso`.
 */
export function LayoutLogin({ children }: LayoutLoginProps) {
  return (
    <div className="relative flex min-h-dvh overflow-hidden bg-action-primary">
      {/* Foto decorativa: ocupa el lado izquierdo y se funde con el fondo hacia la derecha. El fundido va
          al final para que el borde coincida con el color del panel. */}
      <img
        src="/img/login-auto.jpg"
        alt=""
        width={1400}
        height={2096}
        className="absolute inset-y-0 left-0 h-full w-[64%] object-cover object-[center_85%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[64%] bg-gradient-to-b from-black/40 via-transparent to-black/30"
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[64%] bg-gradient-to-r from-transparent via-transparent via-40% to-action-primary"
      />

      <aside className="relative z-10 flex w-1/2 flex-col justify-center pb-[200px] pl-[120px] pr-sp-24 pt-sp-64">
        {/* El bloque ocupa solo el ancho de la marca para que las frases queden centradas bajo ella. */}
        <div className="flex w-fit flex-col items-center gap-sp-12">
          <div className="flex items-center gap-sp-24">
            <span
              aria-hidden="true"
              className="flex size-28 items-center justify-center rounded-card bg-accent-lime font-sans text-[64px] font-extrabold leading-none text-text-primary"
            >
              N
            </span>
            <p className="whitespace-nowrap text-[76px] font-extrabold leading-[80px] text-action-on-primary">
              {NOMBRE}
            </p>
          </div>
          <div className="flex flex-col gap-sp-4 text-center">
            <h2 className="text-[26px] font-semibold leading-[32px] text-action-on-primary">
              {TITULO_PANEL}
            </h2>
            <p className="text-[18px] leading-[26px] text-surface-subtle">{BAJADA_PANEL}</p>
          </div>
        </div>
      </aside>

      <main className="relative z-10 flex w-1/2 items-center justify-center p-sp-64">
        <div className="w-full max-w-[480px]">{children}</div>
      </main>
    </div>
  );
}
