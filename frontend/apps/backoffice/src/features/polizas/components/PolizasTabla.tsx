import {
  badgeEnum,
  etiquetaEnum,
  formatearFechaCalendario,
  type PolizaListItemResponse,
} from '@nexa/api';
import { Chip, EstadoBadge, Table, type TableColumn } from '@nexa/ui';
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
    width: 124,
    header: 'Número',
    mono: true,
    render: (fila) => (
      <Link
        to={`/polizas/${fila.id}`}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      >
        {fila.numero}
      </Link>
    ),
  },
  { key: 'cliente', header: 'Cliente', width: 176, render: noDisponible },
  {
    key: 'vehiculo',
    width: 210,
    header: 'Vehículo',
    render: (fila) => <PolizaVehiculoCelda patente={fila.patente} />,
  },
  {
    key: 'codigoPlan',
    width: 76,
    header: 'Plan',
    render: (fila) => <Chip tipo="neutro" label={fila.codigoPlan} />,
  },
  {
    key: 'fechaInicio',
    width: 212,
    header: 'Vigencia',
    render: (fila) => (
      <span className="whitespace-nowrap">
        {`${formatearFechaCalendario(fila.fechaInicio)} a ${formatearFechaCalendario(fila.fechaFin)}`}
      </span>
    ),
  },
  { key: 'estado', header: 'Estado', width: 124, render: celdaEstado },
  { key: 'proximoVencimiento', header: 'Próx. vencimiento', width: 132, render: noDisponible },
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
