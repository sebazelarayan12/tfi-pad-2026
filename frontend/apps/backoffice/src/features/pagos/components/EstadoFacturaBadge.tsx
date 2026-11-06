import { badgeEnum, etiquetaEnum, type EstadoFactura } from '@nexa/api';
import { EstadoBadge, type BadgeEstado } from '@nexa/ui';

const BADGE_POR_ESTADO: Record<EstadoFactura, BadgeEstado> = {
  PENDIENTE_CAE: 'Pendiente CAE',
  AUTORIZADA: 'Vigente',
};

export interface EstadoFacturaBadgeProps {
  estado: EstadoFactura;
}

/** Badge de factura: `Facturada` usa el token Vigente y `Pendiente CAE` el de Suspendida. */
export function EstadoFacturaBadge({ estado }: EstadoFacturaBadgeProps) {
  const badge = badgeEnum('EstadoFactura', estado) ?? BADGE_POR_ESTADO[estado];
  const texto = estado === 'AUTORIZADA' ? 'Facturada' : etiquetaEnum('EstadoFactura', estado);

  return <EstadoBadge estado={badge} texto={texto} />;
}
