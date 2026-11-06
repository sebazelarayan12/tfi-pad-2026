import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { clasesButton, type ButtonSize, type ButtonVariant } from './estilos';

export type { ButtonSize, ButtonVariant } from './estilos';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Decorativo: el nombre accesible es siempre `label`. */
  icon?: ReactNode;
}

/**
 * Botón con tres variantes y dos tamaños (`design-system §5.1`).
 * `type` es `"button"` por defecto para no enviar un `<form>` sin querer.
 * Para navegar, usar `ButtonLink` (mismo aspecto, renderiza un enlace).
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
  const clases = clasesButton(variant, size);

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
