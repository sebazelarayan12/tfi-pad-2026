import { ESTADO_BADGE_TOKENS, type BadgeEstado } from './estados';

export interface EstadoBadgeProps {
  estado: BadgeEstado;
  /** Texto visible cuando no coincide con el nombre del token (p. ej. Aprobado con Vigente). */
  texto?: string;
}

/**
 * Badge de estado: el texto visible es el literal del estado, sin ícono (`design-system §5.4`).
 * Suspendida y Pendiente CAE no cumplen AA (4.42:1); se implementa el token tal cual (FB7.8).
 */
export function EstadoBadge({ estado, texto }: EstadoBadgeProps) {
  const { fondo, texto: claseTexto } = ESTADO_BADGE_TOKENS[estado];

  return (
    <span
      className={`inline-flex h-6 items-center rounded-pill px-sp-12 py-sp-4 text-label ${fondo} ${claseTexto}`}
    >
      {texto ?? estado}
    </span>
  );
}
