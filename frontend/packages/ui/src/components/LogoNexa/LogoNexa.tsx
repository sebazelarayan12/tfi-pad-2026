export interface LogoNexaProps {
  showWordmark?: boolean;
}

const NOMBRE = 'Nexa Seguros';

/**
 * Marca "N" de 28×28 y wordmark (`design-system §5.7`). La "N" usa clases arbitrarias
 * sin token propio (D-T07-4). Sin wordmark, el contenedor se anuncia como imagen.
 */
export function LogoNexa({ showWordmark = true }: LogoNexaProps) {
  const accesibilidad = showWordmark ? {} : { role: 'img', 'aria-label': NOMBRE };

  return (
    <div className="inline-flex items-center gap-sp-8" {...accesibilidad}>
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-input bg-action-primary font-sans text-[16px] font-bold leading-normal text-action-on-primary"
      >
        N
      </span>
      {showWordmark ? <span className="text-h3 text-text-primary">{NOMBRE}</span> : null}
    </div>
  );
}
