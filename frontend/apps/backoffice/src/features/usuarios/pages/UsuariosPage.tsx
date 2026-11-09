import { isApiError, type UsuarioListItemMock } from '@nexa/api';
import { AlertaError, Button, toast } from '@nexa/ui';
import { useRef, useState } from 'react';

import { emailSesion, useRol, useSesion } from '../../auth';
import { useActivarUsuario } from '../api/useActivarUsuario';
import { useUsuarios } from '../api/useUsuarios';
import { ConfirmarDesactivarUsuarioDialog } from '../components/ConfirmarDesactivarUsuarioDialog';
import { EditarUsuarioPanel } from '../components/EditarUsuarioPanel';
import {
  NuevoEmpleadoPanel,
  type NuevoEmpleadoPanelHandle,
} from '../components/NuevoEmpleadoPanel';
import { UsuariosTable } from '../components/UsuariosTable';
import { esUltimoAdministradorActivo } from '../schemas/reglasUsuario';

const MENSAJE_ACTUALIZADO = 'Usuario actualizado.';
const MENSAJE_INESPERADO = 'Ocurrió un error inesperado.';

/** `detail` del back si lo hay; `null` cuando el error no trae detalle (red, 500 sin cuerpo). */
function detalleDelError(error: unknown): string | null {
  return isApiError(error) && error.kind === 'http' ? (error.detail ?? null) : null;
}

function ContenidoUsuarios() {
  const panel = useRef<NuevoEmpleadoPanelHandle>(null);
  const sesion = useSesion();
  const usuarios = useUsuarios();
  const activar = useActivarUsuario();
  const enviando = useRef(false);
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [desactivando, setDesactivando] = useState<UsuarioListItemMock | null>(null);
  const [errorActivar, setErrorActivar] = useState<string | null>(null);

  const items = usuarios.data?.items;
  const editando = items?.find((usuario) => usuario.id === idEditando);

  function cambiarActivo(usuario: UsuarioListItemMock, activo: boolean) {
    if (enviando.current) return;
    enviando.current = true;
    setErrorActivar(null);
    activar.mutate(
      { id: usuario.id, activo },
      {
        onSuccess: () => toast.success(MENSAJE_ACTUALIZADO),
        onError: (error) => {
          if (isApiError(error) && error.status === 401) return; // La resuelve el cliente (T-08).
          setErrorActivar(detalleDelError(error) ?? MENSAJE_INESPERADO);
        },
        onSettled: () => {
          enviando.current = false;
          setDesactivando(null);
        },
      },
    );
  }

  function nuevoEmpleado() {
    setIdEditando(null);
    panel.current?.reiniciar();
  }

  return (
    <div className="flex gap-sp-24">
      <section aria-label="Usuarios" className="flex min-w-0 flex-1 flex-col gap-sp-16">
        <div className="flex justify-end">
          <Button label="Nuevo empleado" variant="primary" size="m" onClick={nuevoEmpleado} />
        </div>
        {errorActivar ? <AlertaError>{errorActivar}</AlertaError> : null}
        <UsuariosTable
          usuarios={items}
          cargando={usuarios.isPending}
          errorDetalle={usuarios.isError ? (detalleDelError(usuarios.error) ?? '') : undefined}
          emailSesion={emailSesion(sesion)}
          onEditar={(usuario) => setIdEditando(usuario.id)}
          onDesactivar={setDesactivando}
          onActivar={(usuario) => cambiarActivo(usuario, true)}
        />
        {desactivando ? (
          <ConfirmarDesactivarUsuarioDialog
            nombre={`${desactivando.nombre} ${desactivando.apellido}`}
            enviando={activar.isPending}
            onCancelar={() => setDesactivando(null)}
            onConfirmar={() => cambiarActivo(desactivando, false)}
          />
        ) : null}
      </section>
      {editando && items ? (
        <EditarUsuarioPanel
          key={editando.id}
          usuario={editando}
          esUltimoAdministrador={esUltimoAdministradorActivo(editando, items)}
          onCerrar={() => setIdEditando(null)}
        />
      ) : (
        <NuevoEmpleadoPanel ref={panel} />
      )}
    </div>
  );
}

/**
 * B14 Usuarios, solo Administrador. La tabla de usuarios ocupa la columna izquierda; a la derecha queda
 * el panel `Nuevo empleado`, que se reemplaza por el de edición mientras se edita (D-B25-04).
 * La guarda está acá y no en `RequireRol` porque un feature no puede importar el app-shell (FB3-4).
 */
export function UsuariosPage() {
  const rol = useRol();
  if (rol !== 'Administrador') {
    return <p className="p-sp-24 text-text-primary">No tenés permiso para esta acción.</p>;
  }
  return <ContenidoUsuarios />;
}
