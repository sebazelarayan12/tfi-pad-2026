export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'm' | 's';

const BASE =
  'inline-flex items-center justify-center gap-sp-8 rounded-pill focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTES: Record<ButtonVariant, string> = {
  primary: 'bg-action-primary text-action-on-primary',
  secondary: 'border border-border-strong bg-surface-panel text-text-primary',
  ghost: 'bg-transparent text-text-primary',
};

const TAMANOS: Record<ButtonSize, string> = {
  m: 'h-10 px-sp-16 text-body',
  s: 'h-8 px-sp-12 text-label',
};

/**
 * Clases del botón (`design-system §5.1`); las comparten `Button` y `ButtonLink`.
 * `nx-boton*` son ganchos sin estilo propio: cada app decide si les da movimiento.
 */
export function clasesButton(variant: ButtonVariant, size: ButtonSize): string {
  return `nx-boton nx-boton-${variant} ${BASE} ${VARIANTES[variant]} ${TAMANOS[size]}`;
}
