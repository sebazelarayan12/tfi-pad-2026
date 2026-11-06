import {
  formatearFechaHora,
  formatearImporte,
  isApiError,
  type HistorialRendicionResponse,
} from '@nexa/api';
import { AlertaError, EstadoBadge, Table, type TableColumn } from '@nexa/ui';
import { useHistorialRendiciones } from '../api/useHistorialRendiciones';

type FilaHistorial = HistorialRendicionResponse & { estado: 'Procesado' };
const TITULO = 'Archivos procesados';
const COLUMNAS: ReadonlyArray<TableColumn<FilaHistorial>> = [
  {
    key: 'nombreArchivo',
    header: 'Archivo',
    width: 260,
    mono: true,
    render: ({ nombreArchivo }) => (
      <span className="break-words" translate="no">
        {nombreArchivo}
      </span>
    ),
  },
  {
    key: 'fechaProceso',
    header: 'Fecha de proceso',
    width: 170,
    render: ({ fechaProceso }) => formatearFechaHora(fechaProceso),
  },
  { key: 'cantidadRegistros', header: 'Líneas', width: 110 },
  { key: 'pagosAprobados', header: 'Pagos generados', width: 170 },
  {
    key: 'importeTotal',
    header: 'Importe total',
    width: 170,
    render: ({ importeTotal }) => (
      <span className="block text-right tabular-nums">{formatearImporte(importeTotal)}</span>
    ),
  },
  {
    key: 'estado',
    header: 'Estado',
    width: 164,
    render: ({ estado }) => <EstadoBadge estado="Vigente" texto={estado} />,
  },
];

function HistorialCargando() {
  return (
    <div role="status" aria-label="Cargando historial">
      {[1, 2, 3].map((fila) => (
        <div
          key={fila}
          aria-hidden="true"
          className="flex h-12 items-center border-b border-border-hairline px-sp-16"
        >
          <div className="h-4 w-full rounded-input bg-surface-subtle" />
        </div>
      ))}
    </div>
  );
}

function HistorialContenido() {
  const historial = useHistorialRendiciones();
  if (historial.isPending) return <HistorialCargando />;
  if (historial.isError) {
    const detalle = isApiError(historial.error) ? historial.error.detail : null;
    return (
      <AlertaError>No se pudo cargar el historial.{detalle ? ` ${detalle}` : null}</AlertaError>
    );
  }
  if (historial.data.length === 0) return <p>No hay rendiciones procesadas.</p>;

  const filas = historial.data.map((rendicion): FilaHistorial => ({
    ...rendicion,
    estado: 'Procesado',
  }));
  return (
    <div className="overflow-x-auto rounded-input border border-border-hairline">
      <Table caption={TITULO} columns={COLUMNAS} rows={filas} getRowKey={(fila) => fila.id} />
    </div>
  );
}

export function HistorialRendicionesTable() {
  return (
    <div className="flex flex-col gap-sp-8">
      <h4 className="text-label text-text-secondary">{TITULO}</h4>
      <HistorialContenido />
    </div>
  );
}
