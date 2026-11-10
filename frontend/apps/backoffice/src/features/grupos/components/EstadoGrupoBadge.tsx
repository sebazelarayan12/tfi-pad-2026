import { ESTADO_GRUPO, type EstadoGrupo } from '@nexa/api';
import { EstadoBadge } from '@nexa/ui';

/** Reutiliza los tokens de estado del diseño: Aprobada = Vigente, Rechazada = Vencida, Revocada = Cancelada. */
export function EstadoGrupoBadge({ estado }: { estado: EstadoGrupo }) {
  switch (estado) {
    case ESTADO_GRUPO.Aprobada:
      return <EstadoBadge estado="Vigente" texto="Aprobada" />;
    case ESTADO_GRUPO.Rechazada:
      return <EstadoBadge estado="Vencida" texto="Rechazada" />;
    case ESTADO_GRUPO.Revocada:
      return <EstadoBadge estado="Cancelada" texto="Revocada" />;
    default:
      return <EstadoBadge estado="Pendiente" />;
  }
}
