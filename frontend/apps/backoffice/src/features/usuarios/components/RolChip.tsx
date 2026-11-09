import type { RolUsuario } from '@nexa/api';
import { Chip } from '@nexa/ui';

/** `Administrador` destacado (lime) y `Empleado` neutro, como en el Figma (D-B25-05). */
export function RolChip({ rol }: { rol: RolUsuario }) {
  return <Chip tipo={rol === 'Administrador' ? 'destacado' : 'neutro'} label={rol} />;
}
