import { badgeEnum } from '@nexa/api';
import { EstadoBadge } from '@nexa/ui';

/** Badge del estado de una póliza. Un valor fuera del mapa se muestra como "Desconocido". */
export function BadgeEstadoPoliza({ estado }: { estado: number }) {
  const badge = badgeEnum('EstadoPoliza', estado);
  if (badge === null) return <span className="text-label text-text-secondary">Desconocido</span>;
  return <EstadoBadge estado={badge} />;
}
