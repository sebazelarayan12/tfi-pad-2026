import { MoonIcon } from '@phosphor-icons/react/dist/csr/Moon';
import { SunIcon } from '@phosphor-icons/react/dist/csr/Sun';

import { FOCO } from '../estilos';
import { useTema } from './useTema';

const ETIQUETA = 'Modo oscuro';
const TAMANO_ICONO = 16;

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
      onClick={alternar}
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
