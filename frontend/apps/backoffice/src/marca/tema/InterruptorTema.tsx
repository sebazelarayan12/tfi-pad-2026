import { MoonIcon } from '@phosphor-icons/react/dist/csr/Moon';
import { SunIcon } from '@phosphor-icons/react/dist/csr/Sun';

import { flushSync } from 'react-dom';

import { useTema } from './useTema';

const FOCO = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tema-acento';
const ETIQUETA = 'Modo oscuro';
const TAMANO_ICONO = 16;
const DURACION_APERTURA_MS = 550;

type DocumentoConTransicion = Document & {
  startViewTransition?: (cambio: () => void) => { ready: Promise<void> };
};

/**
 * Cambia el tema abriendo el modo nuevo en círculo desde el interruptor (View Transitions).
 * Sin soporte, o con movimiento reducido, el cambio es directo.
 */
function alternarConApertura(boton: HTMLElement, alternar: () => void): void {
  const documento: DocumentoConTransicion = document;
  const reducido =
    typeof window.matchMedia !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof documento.startViewTransition !== 'function' || reducido) {
    alternar();
    return;
  }
  const caja = boton.getBoundingClientRect();
  const x = caja.left + caja.width / 2;
  const y = caja.top + caja.height / 2;
  const radio = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const transicion = documento.startViewTransition(() => flushSync(alternar));
  void transicion.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
      {
        duration: DURACION_APERTURA_MS,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    );
  });
}

interface InterruptorTemaProps {
  className?: string;
}

/**
 * Interruptor de modo claro/oscuro: una pastilla con el sol y la luna y una perilla que se
 * desliza hacia el modo activo. Es un `switch`: el lector anuncia "Modo oscuro, activado".
 */
export function InterruptorTema({ className = '' }: InterruptorTemaProps) {
  const { tema, alternar } = useTema();
  const oscuro = tema === 'oscuro';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={oscuro}
      aria-label={ETIQUETA}
      title={ETIQUETA}
      onClick={(evento) => alternarConApertura(evento.currentTarget, alternar)}
      className={`relative inline-flex h-11 w-[76px] shrink-0 items-center justify-between rounded-pill border border-border-strong bg-tema-fondo-alt px-[9px] text-text-secondary ${FOCO} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-1 top-1/2 size-9 -translate-y-1/2 rounded-full bg-tema-boton-fuerte motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out ${oscuro ? 'translate-x-8' : 'translate-x-0'}`}
      />
      <span aria-hidden="true" className={`relative inline-flex ${oscuro ? '' : 'text-white'}`}>
        <SunIcon size={TAMANO_ICONO} weight="bold" />
      </span>
      <span
        aria-hidden="true"
        className={`relative inline-flex ${oscuro ? 'text-marca-marino' : ''}`}
      >
        <MoonIcon size={TAMANO_ICONO} weight="bold" />
      </span>
    </button>
  );
}
