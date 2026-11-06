import { badgeEnum, etiquetaEnum, type EstadoPago } from '@nexa/api';
import { EstadoBadge, type BadgeEstado } from '@nexa/ui';

const BADGE_POR_ESTADO: Record<EstadoPago, BadgeEstado> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Vigente',
  RECHAZADO: 'Cancelada',
};

export interface EstadoPagoBadgeProps {
  estado: EstadoPago;
}

/** Badge de pago con el texto del Figma y el token semántico de T-10. */
export function EstadoPagoBadge({ estado }: EstadoPagoBadgeProps) {
  const badge = badgeEnum('EstadoPago', estado) ?? BADGE_POR_ESTADO[estado];

  return <EstadoBadge estado={badge} texto={etiquetaEnum('EstadoPago', estado)} />;
}
