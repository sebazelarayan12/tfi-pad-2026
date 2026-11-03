import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'm' | 's';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Decorativo: el nombre accesible es siempre `label`. */
  icon?: ReactNode;
}

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
 * Botón con tres variantes y dos tamaños (`design-system §5.1`).
 * `type` es `"button"` por defecto para no enviar un `<form>` sin querer.
 */
export function Button({
  label,
  variant = 'primary',
  size = 'm',
  icon,
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  const clases = `${BASE} ${VARIANTES[variant]} ${TAMANOS[size]}`;

  return (
    <button {...rest} type={type} className={className ? `${clases} ${className}` : clases}>
      {icon ? (
        <span aria-hidden="true" className="inline-flex">
          {icon}
        </span>
      ) : null}
      {label}
    </button>
  );
}
