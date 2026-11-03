export type ChipTipo = 'destacado' | 'neutro' | 'seleccionado' | 'sin-seleccionar';

export interface ChipProps {
  tipo: ChipTipo;
  label: string;
  /** Solo se usa en `seleccionado` y `sin-seleccionar`; en los otros se ignora. */
  onClick?: () => void;
}

const BASE = 'inline-flex h-7 items-center rounded-pill px-sp-12 py-sp-4 text-label';

const ESTATICOS = {
  destacado: 'bg-accent-lime text-text-primary',
  neutro: 'bg-surface-subtle text-text-secondary',
} as const;

const INTERACTIVOS = {
  seleccionado: 'bg-action-primary text-action-on-primary',
  'sin-seleccionar': 'border border-border-strong bg-surface-panel text-text-primary',
} as const;

const FOCO =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary';

/**
 * Chip del diseño (`design-system §5.5`). `destacado` y `neutro` son texto (`<span>`);
 * `seleccionado` y `sin-seleccionar` son `<button aria-pressed>`.
 */
export function Chip({ tipo, label, onClick }: ChipProps) {
  if (tipo === 'destacado' || tipo === 'neutro') {
    return <span className={`${BASE} ${ESTATICOS[tipo]}`}>{label}</span>;
  }

  return (
    <button
      type="button"
      aria-pressed={tipo === 'seleccionado'}
      onClick={onClick}
      className={`${BASE} ${INTERACTIVOS[tipo]} ${FOCO}`}
    >
      {label}
    </button>
  );
}
