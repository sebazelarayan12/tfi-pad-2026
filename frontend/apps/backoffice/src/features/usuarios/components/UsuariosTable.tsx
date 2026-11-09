import type { UsuarioListItemMock } from '@nexa/api';
import { AlertaError, Table, type TableColumn } from '@nexa/ui';

import { motivoBloqueoDesactivar } from '../schemas/reglasUsuario';
import { EstadoUsuarioBadge } from './EstadoUsuarioBadge';
import { MenuUsuario } from './MenuUsuario';
import { RolChip } from './RolChip';
import { UsuarioAvatar } from './UsuarioAvatar';

export const MENSAJE_LISTA_VACIA = 'No hay usuarios.';
export const MENSAJE_LISTA_ERROR = 'No se pudieron cargar los usuarios.';

interface UsuariosTableProps {
  usuarios: ReadonlyArray<UsuarioListItemMock> | undefined;
  cargando: boolean;
  /** `detail` del back o `null` cuando la lista falló sin detalle; `undefined` si no hay error. */
  errorDetalle: string | null | undefined;
  emailSesion: string | null;
  onEditar: (usuario: UsuarioListItemMock) => void;
  onDesactivar: (usuario: UsuarioListItemMock) => void;
  onActivar: (usuario: UsuarioListItemMock) => void;
}

function Esqueleto() {
  return (
    <ul aria-hidden="true" className="flex flex-col gap-sp-8">
      {[0, 1, 2].map((indice) => (
        <li
          key={indice}
          className="h-16 rounded-input bg-surface-subtle motion-safe:animate-pulse"
        />
      ))}
    </ul>
  );
}

/** Tabla de B14: `Usuario`, `Rol`, `Estado` y el menú de acciones; sin `Último ingreso` (PB-04). */
export function UsuariosTable({
  usuarios,
  cargando,
  errorDetalle,
  emailSesion,
  onEditar,
  onDesactivar,
  onActivar,
}: UsuariosTableProps) {
  if (cargando) return <Esqueleto />;
  if (errorDetalle !== undefined) {
    return (
      <AlertaError>
        {MENSAJE_LISTA_ERROR}
        {errorDetalle ? ` ${errorDetalle}` : ''}
      </AlertaError>
    );
  }
  if (!usuarios || usuarios.length === 0) {
    return <p className="text-body-sm text-text-secondary">{MENSAJE_LISTA_VACIA}</p>;
  }

  const columnas: ReadonlyArray<TableColumn<UsuarioListItemMock>> = [
    {
      key: 'email',
      header: 'Usuario',
      width: 300,
      render: (usuario) => (
        <div className="flex items-center gap-sp-12">
          <UsuarioAvatar nombre={usuario.nombre} apellido={usuario.apellido} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-body-sm text-text-primary">
              {usuario.nombre} {usuario.apellido}
            </span>
            <span className="truncate text-[11px] text-text-secondary">{usuario.email}</span>
          </div>
        </div>
      ),
    },
    { key: 'rol', header: 'Rol', width: 130, render: (usuario) => <RolChip rol={usuario.rol} /> },
    {
      key: 'activo',
      header: 'Estado',
      width: 105,
      render: (usuario) => <EstadoUsuarioBadge activo={usuario.activo} />,
    },
    {
      key: 'id',
      header: 'Acciones',
      width: 64,
      render: (usuario) => (
        <MenuUsuario
          nombre={`${usuario.nombre} ${usuario.apellido}`}
          activo={usuario.activo}
          motivoBloqueo={motivoBloqueoDesactivar(usuario, usuarios, emailSesion)}
          onEditar={() => onEditar(usuario)}
          onDesactivar={() => onDesactivar(usuario)}
          onActivar={() => onActivar(usuario)}
        />
      ),
    },
  ];

  return (
    <div className="overflow-x-auto">
      <Table caption="Usuarios" columns={columnas} rows={usuarios} getRowKey={(u) => u.id} />
    </div>
  );
}
