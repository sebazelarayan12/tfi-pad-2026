import { Button } from '@nexa/ui';
import { useRef } from 'react';

import { useRol } from '../../auth';
import {
  NuevoEmpleadoPanel,
  type NuevoEmpleadoPanelHandle,
} from '../components/NuevoEmpleadoPanel';

function ContenidoUsuarios() {
  const panel = useRef<NuevoEmpleadoPanelHandle>(null);

  return (
    <div className="flex gap-sp-24">
      <section aria-label="Usuarios" className="flex min-w-0 flex-1 flex-col gap-sp-16">
        <div className="flex justify-end">
          <Button
            label="Nuevo empleado"
            variant="primary"
            size="m"
            onClick={() => panel.current?.reiniciar()}
          />
        </div>
      </section>
      <NuevoEmpleadoPanel ref={panel} />
    </div>
  );
}

/**
 * B14 Usuarios, solo Administrador. La tabla de usuarios es de US-FE-B-25 y ocupa la columna
 * izquierda; el panel `Nuevo empleado` queda siempre visible a la derecha, como en el Figma.
 * La guarda está acá y no en `RequireRol` porque un feature no puede importar el app-shell (FB3-4).
 */
export function UsuariosPage() {
  const rol = useRol();
  if (rol !== 'Administrador') {
    return <p className="p-sp-24 text-text-primary">No tenés permiso para esta acción.</p>;
  }
  return <ContenidoUsuarios />;
}
