import {
  badgeEnum,
  etiquetaEnum,
  formatearFechaCalendario,
  type PolizaListItemResponse,
} from '@nexa/api';
import { Chip, EstadoBadge, Table, type TableColumn } from '@nexa/ui';
import { Link } from 'react-router-dom';

import { PolizaVehiculoCelda } from './PolizaVehiculoCelda';

/** Sin cuotas pendientes (póliza vencida o cancelada, o con todo pago) no hay próximo vencimiento. */
const SIN_VENCIMIENTO = '-';

function celdaEstado(fila: PolizaListItemResponse) {
  const badge = badgeEnum('EstadoPoliza', fila.estado);
  const etiqueta = etiquetaEnum('EstadoPoliza', fila.estado);
  return badge === null ? etiqueta : <EstadoBadge estado={badge} texto={etiqueta} />;
}

const COLUMNAS: ReadonlyArray<TableColumn<PolizaListItemResponse>> = [
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
  { key: 'clienteNombre', header: 'Cliente', width: 176, render: (fila) => fila.clienteNombre },
  {
    key: 'vehiculoMarca',
    width: 210,
    header: 'Vehículo',
    render: (fila) => (
      <PolizaVehiculoCelda
        marca={fila.vehiculoMarca}
        modelo={fila.vehiculoModelo}
        anio={fila.vehiculoAnio}
        patente={fila.patente}
      />
    ),
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
  {
    key: 'proximoVencimiento',
    header: 'Próx. vencimiento',
    width: 132,
    render: (fila) =>
      fila.proximoVencimiento === null
        ? SIN_VENCIMIENTO
        : formatearFechaCalendario(fila.proximoVencimiento),
  },
];

interface PolizasTablaProps {
  polizas: ReadonlyArray<PolizaListItemResponse>;
}

export function PolizasTabla({ polizas }: PolizasTablaProps) {
  return (
    <Table caption="Pólizas" columns={COLUMNAS} rows={polizas} getRowKey={(fila) => fila.id} />
  );
}
