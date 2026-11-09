import {
  etiquetaEnum,
  formatearFechaHora,
  formatearImporte,
  TEXTO_SIN_DATO,
  type CotizacionListItemResponse,
} from '@nexa/api';
import { EstadoBadge, Table, type TableColumn } from '@nexa/ui';

/** Solo la fecha (`dd/mm/aaaa`) de un instante UTC, en hora de Argentina (FB4). */
function soloFecha(valor: string): string {
  return formatearFechaHora(valor).split(' ')[0] ?? TEXTO_SIN_DATO;
}

const COLUMNAS: ReadonlyArray<TableColumn<CotizacionListItemResponse>> = [
  {
    key: 'fechaCotizacion',
    header: 'Fecha',
    width: 99,
    render: (cotizacion) => soloFecha(cotizacion.fechaCotizacion),
  },
  {
    key: 'clienteNombre',
    header: 'Cliente',
    width: 160,
    render: (cotizacion) => cotizacion.clienteNombre ?? TEXTO_SIN_DATO,
  },
  {
    key: 'patente',
    header: 'Patente',
    width: 90,
    mono: true,
    render: (cotizacion) => cotizacion.patente ?? TEXTO_SIN_DATO,
  },
  { key: 'nombrePlan', header: 'Plan', width: 170 },
  {
    key: 'primaMensual',
    header: 'Prima mensual',
    width: 120,
    mono: true,
    render: (cotizacion) => (
      <span className="block text-right">{formatearImporte(cotizacion.primaMensual)}</span>
    ),
  },
  {
    key: 'fechaVencimiento',
    header: 'Vence',
    width: 99,
    render: (cotizacion) => soloFecha(cotizacion.fechaVencimiento),
  },
  {
    key: 'vigente',
    header: 'Estado',
    width: 91,
    render: (cotizacion) => (
      <EstadoBadge
        estado={cotizacion.vigente ? 'Vigente' : 'Vencida'}
        texto={cotizacion.vigente ? 'Vigente' : 'Vencida'}
      />
    ),
  },
  {
    key: 'origen',
    header: 'Origen',
    width: 80,
    render: (cotizacion) => etiquetaEnum('OrigenCotizacion', cotizacion.origen),
  },
];

interface CotizacionesTablaProps {
  cotizaciones: ReadonlyArray<CotizacionListItemResponse>;
}

export function CotizacionesTabla({ cotizaciones }: CotizacionesTablaProps) {
  return (
    <Table
      caption="Cotizaciones"
      columns={COLUMNAS}
      rows={cotizaciones}
      getRowKey={(cotizacion) => cotizacion.id}
    />
  );
}
