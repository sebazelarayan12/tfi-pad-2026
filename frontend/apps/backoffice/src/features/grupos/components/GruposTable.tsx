import { ESTADO_GRUPO, type GrupoListItemResponse } from '@nexa/api';
import { AlertaError, Button, Table, type TableColumn } from '@nexa/ui';

import { EstadoGrupoBadge } from './EstadoGrupoBadge';

export const MENSAJE_LISTA_VACIA = 'Todavía no hay solicitudes de grupos.';
export const MENSAJE_LISTA_ERROR = 'No se pudieron cargar los grupos.';

export type AccionFila = 'aprobar' | 'rechazar' | 'revocar';

interface GruposTableProps {
  grupos: ReadonlyArray<GrupoListItemResponse> | undefined;
  cargando: boolean;
  /** `detail` del back o `null` cuando la lista falló sin detalle; `undefined` si no hay error. */
  errorDetalle: string | null | undefined;
  onAccion: (accion: AccionFila, grupo: GrupoListItemResponse) => void;
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

const formatearFecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR');

/** Acciones según el estado: la pendiente se aprueba o rechaza, la aprobada se revoca, el resto se reaprueba. */
function Acciones({
  grupo,
  onAccion,
}: {
  grupo: GrupoListItemResponse;
  onAccion: GruposTableProps['onAccion'];
}) {
  const aprobar = (
    <Button label="Aprobar" variant="primary" size="s" onClick={() => onAccion('aprobar', grupo)} />
  );
  if (grupo.estado === ESTADO_GRUPO.Pendiente) {
    return (
      <div className="flex gap-sp-8">
        {aprobar}
        <Button
          label="Rechazar"
          variant="secondary"
          size="s"
          onClick={() => onAccion('rechazar', grupo)}
        />
      </div>
    );
  }
  if (grupo.estado === ESTADO_GRUPO.Aprobada) {
    return (
      <Button
        label="Revocar"
        variant="secondary"
        size="s"
        onClick={() => onAccion('revocar', grupo)}
      />
    );
  }
  return aprobar;
}

export function GruposTable({ grupos, cargando, errorDetalle, onAccion }: GruposTableProps) {
  if (cargando) return <Esqueleto />;
  if (errorDetalle !== undefined) {
    return (
      <AlertaError>
        {MENSAJE_LISTA_ERROR}
        {errorDetalle ? ` ${errorDetalle}` : ''}
      </AlertaError>
    );
  }
  if (!grupos || grupos.length === 0) {
    return <p className="text-body-sm text-text-secondary">{MENSAJE_LISTA_VACIA}</p>;
  }

  const columnas: ReadonlyArray<TableColumn<GrupoListItemResponse>> = [
    {
      key: 'nombre',
      header: 'Grupo',
      width: 280,
      render: (grupo) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-body-sm text-text-primary">{grupo.nombre}</span>
          <span className="truncate text-label text-text-secondary">
            {grupo.contacto} · {grupo.email}
          </span>
        </div>
      ),
    },
    {
      key: 'descripcion',
      header: 'Para qué la usa',
      render: (grupo) => (
        <div className="flex flex-col">
          <span className="text-body-sm text-text-primary">{grupo.descripcion}</span>
          {grupo.motivo ? (
            <span className="text-label text-text-secondary">Motivo: {grupo.motivo}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'fechaSolicitud',
      header: 'Solicitud',
      width: 120,
      render: (grupo) => formatearFecha(grupo.fechaSolicitud),
    },
    {
      key: 'estado',
      header: 'Estado',
      width: 130,
      render: (grupo) => (
        <div className="flex flex-col gap-sp-4">
          <EstadoGrupoBadge estado={grupo.estado} />
          {grupo.estado === ESTADO_GRUPO.Aprobada ? (
            <span className="text-label text-text-secondary">
              {grupo.tieneClave ? 'Con clave' : 'Sin clave todavía'}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'id',
      header: 'Acciones',
      width: 190,
      render: (grupo) => <Acciones grupo={grupo} onAccion={onAccion} />,
    },
  ];

  return (
    <Table caption="Grupos externos" columns={columnas} rows={grupos} getRowKey={(g) => g.id} />
  );
}
