import {
  etiquetaEnum,
  formatearFechaHora,
  formatearImporte,
  TEXTO_SIN_DATO,
  type PagoListadoResponse,
} from '@nexa/api';
import { Table, type TableColumn } from '@nexa/ui';

import { EstadoPagoBadge } from './EstadoPagoBadge';
import { FacturaCell } from './FacturaCell';
import { textoCuotas } from './textoCuotas';

/** Solo la fecha (`dd/mm/aaaa`) del `FechaCreacion` UTC, en hora de Argentina (FB4). */
function soloFecha(valor: string): string {
  return formatearFechaHora(valor).split(' ')[0] ?? TEXTO_SIN_DATO;
}

const COLUMNAS: ReadonlyArray<TableColumn<PagoListadoResponse>> = [
  {
    key: 'fechaCreacion',
    header: 'Fecha',
    width: 99,
    render: (pago) => soloFecha(pago.fechaCreacion),
  },
  { key: 'clienteNombre', header: 'Cliente', width: 121 },
  { key: 'numeroPoliza', header: 'Póliza', width: 102, mono: true },
  { key: 'cuotas', header: 'Cuotas', width: 50, render: (pago) => textoCuotas(pago.cuotas) },
  {
    key: 'medio',
    header: 'Medio',
    width: 84,
    render: (pago) => etiquetaEnum('MedioPago', pago.medio),
  },
  {
    key: 'importe',
    header: 'Importe',
    width: 102,
    mono: true,
    render: (pago) => <span className="block text-right">{formatearImporte(pago.importe)}</span>,
  },
  {
    key: 'estado',
    header: 'Estado',
    width: 91,
    render: (pago) => <EstadoPagoBadge estado={pago.estado} />,
  },
  {
    key: 'factura',
    header: 'Factura',
    width: 144,
    render: (pago) => <FacturaCell factura={pago.factura} />,
  },
];

interface PagosTableProps {
  pagos: ReadonlyArray<PagoListadoResponse>;
}

export function PagosTable({ pagos }: PagosTableProps) {
  return <Table caption="Pagos" columns={COLUMNAS} rows={pagos} getRowKey={(pago) => pago.id} />;
}
