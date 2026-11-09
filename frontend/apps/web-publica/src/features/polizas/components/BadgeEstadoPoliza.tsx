import type { EstadoPolizaPublico } from '@nexa/api';
import { EstadoBadge, type BadgeEstado } from '@nexa/ui';

/** Estado de póliza del back → `Badge/Estado` del diseño. Los textos de Suspendida, Cancelada y Vencida son propuesta (DN-W4-4). */
const BADGE_POR_ESTADO: Record<EstadoPolizaPublico, BadgeEstado> = {
  PENDIENTE: 'Pendiente',
  VIGENTE: 'Vigente',
  SUSPENDIDA: 'Suspendida',
  CANCELADA: 'Cancelada',
  VENCIDA: 'Vencida',
};

interface BadgeEstadoPolizaProps {
  estado: EstadoPolizaPublico;
}

export function BadgeEstadoPoliza({ estado }: BadgeEstadoPolizaProps) {
  return <EstadoBadge estado={BADGE_POR_ESTADO[estado]} />;
}
