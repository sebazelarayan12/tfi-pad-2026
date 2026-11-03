import type { ReactNode } from 'react';

export interface DatoProps {
  label: string;
  value: ReactNode | null | undefined;
  /** Para DNI, CUIL y patente (`design-system §5.12`). */
  mono?: boolean;
}

/** Texto cuando el dato falta (FB7.11, D-T07-6). */
const SIN_VALOR = 'No disponible';

/** Par etiqueta/valor. Estilo propuesto (D-T07-1), no definido en el Figma. */
export function Dato({ label, value, mono = false }: DatoProps) {
  const sinValor = value === null || value === undefined || value === '';

  return (
    <dl className="flex flex-col gap-sp-4">
      <dt className="text-label text-text-secondary">{label}</dt>
      <dd
        className={
          mono ? 'font-mono text-mono text-text-primary' : 'text-body-sm text-text-primary'
        }
      >
        {sinValor ? SIN_VALOR : value}
      </dd>
    </dl>
  );
}
