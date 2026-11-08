import { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { useId, type ReactNode } from 'react';

interface OpcionMedioPagoProps<T extends string> {
  /** `name` compartido por las opciones del grupo. */
  grupo: string;
  valor: T;
  titulo: string;
  descripcion: string;
  /** Decorativo (24 px). */
  icono: ReactNode;
  seleccionada: boolean;
  deshabilitada: boolean;
  onSeleccionar: (valor: T) => void;
}

const BASE =
  'flex min-h-14 cursor-pointer items-center gap-sp-16 rounded-card border p-sp-20 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-action-primary has-[:disabled]:cursor-not-allowed';
const SELECCIONADA = 'border-accent-lime bg-accent-lime-soft';
const NO_SELECCIONADA = 'border-border-strong bg-surface-panel';

/**
 * Tarjeta de un medio de pago (W4 §3, §12): un `label` que envuelve el radio nativo, así toda la
 * tarjeta es clicable y las flechas mueven la selección. El nombre es el título y la descripción
 * queda como `aria-describedby`. El check no depende solo del color.
 */
export function OpcionMedioPago<T extends string>({
  grupo,
  valor,
  titulo,
  descripcion,
  icono,
  seleccionada,
  deshabilitada,
  onSeleccionar,
}: OpcionMedioPagoProps<T>) {
  const id = useId();
  const idTitulo = `${id}-titulo`;
  const idDescripcion = `${id}-descripcion`;

  return (
    <label className={`${BASE} ${seleccionada ? SELECCIONADA : NO_SELECCIONADA}`}>
      <input
        type="radio"
        name={grupo}
        value={valor}
        checked={seleccionada}
        disabled={deshabilitada}
        onChange={() => onSeleccionar(valor)}
        aria-labelledby={idTitulo}
        aria-describedby={idDescripcion}
        className="sr-only"
      />
      <span aria-hidden="true" className="inline-flex shrink-0 text-text-primary">
        {icono}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-sp-4">
        <span id={idTitulo} className="text-h3 text-text-primary">
          {titulo}
        </span>
        <span id={idDescripcion} className="text-body-sm text-text-secondary">
          {descripcion}
        </span>
      </span>
      <span aria-hidden="true" className="inline-flex size-6 shrink-0 text-text-primary">
        {seleccionada ? <CheckCircleIcon size={24} weight="fill" /> : null}
      </span>
    </label>
  );
}
