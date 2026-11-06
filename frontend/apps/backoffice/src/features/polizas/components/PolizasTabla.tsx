import {
  badgeEnum,
  etiquetaEnum,
  formatearFechaCalendario,
  type PolizaListItemResponse,
} from '@nexa/api';
import { EstadoBadge, Table, type TableColumn } from '@nexa/ui';
import { Link } from 'react-router-dom';

import { TEXTO_NO_DISPONIBLE } from '../textos';
import { PolizaVehiculoCelda } from './PolizaVehiculoCelda';

/** La lista no trae cliente, vehículo ni próximo vencimiento (D1, D5, D6 de B9; DP-B13-01). */
type FilaPoliza = PolizaListItemResponse & {
  cliente: null;
  vehiculo: null;
  proximoVencimiento: null;
};

const noDisponible = () => <span className="text-text-secondary">{TEXTO_NO_DISPONIBLE}</span>;

function celdaEstado(fila: FilaPoliza) {
  const badge = badgeEnum('EstadoPoliza', fila.estado);
  const etiqueta = etiquetaEnum('EstadoPoliza', fila.estado);
  return badge === null ? etiqueta : <EstadoBadge estado={badge} texto={etiqueta} />;
}

const COLUMNAS: ReadonlyArray<TableColumn<FilaPoliza>> = [
  {
    key: 'numero',
    header: 'Número',
    mono: true,
    render: (fila) => (
      <Link
        to={`/polizas/${fila.id}`}
        className="underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      >
        {fila.numero}
      </Link>
    ),
  },
  { key: 'cliente', header: 'Cliente', render: noDisponible },
  {
    key: 'vehiculo',
    header: 'Vehículo',
    render: (fila) => <PolizaVehiculoCelda patente={fila.patente} />,
  },
  { key: 'codigoPlan', header: 'Plan' },
  {
    key: 'fechaInicio',
    header: 'Vigencia',
    render: (fila) =>
      `${formatearFechaCalendario(fila.fechaInicio)} a ${formatearFechaCalendario(fila.fechaFin)}`,
  },
  { key: 'estado', header: 'Estado', render: celdaEstado },
  { key: 'proximoVencimiento', header: 'Próx. vencimiento', render: noDisponible },
];

interface PolizasTablaProps {
  polizas: ReadonlyArray<PolizaListItemResponse>;
}

export function PolizasTabla({ polizas }: PolizasTablaProps) {
  const filas: FilaPoliza[] = polizas.map((poliza) => ({
    ...poliza,
    cliente: null,
    vehiculo: null,
    proximoVencimiento: null,
  }));

  return <Table caption="Pólizas" columns={COLUMNAS} rows={filas} getRowKey={(fila) => fila.id} />;
}
