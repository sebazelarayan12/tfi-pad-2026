import { EstadoBadge } from '@nexa/ui';

/** `Activo` usa el token de Vigente e `Inactivo` el de Vencida (B14 §4). */
export function EstadoUsuarioBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <EstadoBadge estado="Vigente" texto="Activo" />
  ) : (
    <EstadoBadge estado="Vencida" texto="Inactivo" />
  );
}
