import {
  badgeEnum,
  formatearFechaCalendario,
  formatearImporte,
  type CuotaListItemMock,
} from '@nexa/api';
import { EstadoBadge, Table, type TableColumn } from '@nexa/ui';
import { Link } from 'react-router-dom';

const columnas: ReadonlyArray<TableColumn<CuotaListItemMock>> = [
  {
    key: 'clienteNombre',
    header: 'Cliente',
    render: ({ clienteNombre, clienteApellido }) => {
      const nombre = `${clienteNombre} ${clienteApellido}`.trim();
      return (
        <span title={nombre} className="block truncate">
          {nombre}
        </span>
      );
    },
  },
  {
    key: 'numeroPoliza',
    header: 'Póliza',
    mono: true,
    render: ({ polizaId, numeroPoliza }) => (
      <Link
        to={`/polizas/${encodeURIComponent(polizaId)}`}
        className="underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      >
        {numeroPoliza}
      </Link>
    ),
  },
  {
    key: 'numeroCuota',
    header: 'Cuota y vencimiento',
    render: ({ numeroCuota, fechaVencimiento }) => (
      <>
        Cuota {numeroCuota} · {formatearFechaCalendario(fechaVencimiento)}
      </>
    ),
  },
  {
    key: 'importe',
    header: 'Importe',
    render: ({ importe, recargo }) => formatearImporte(importe + recargo),
  },
  {
    key: 'estado',
    header: 'Estado',
    render: ({ estado }) => {
      // PB-24 entrega el literal en MSW. El contrato numérico se resuelve con T-10.
      const badge = estado === 'Vencida' ? estado : badgeEnum('EstadoCuota', estado);
      return badge ? <EstadoBadge estado={badge} /> : <span>Desconocido</span>;
    },
  },
];

export function TablaCuotasVencidas({ cuotas }: { cuotas: CuotaListItemMock[] }) {
  return (
    <div className="overflow-x-auto rounded-input border border-border-hairline">
      <div className="min-w-[640px]">
        <Table
          caption="Cuotas vencidas recientes"
          columns={columnas}
          rows={cuotas}
          getRowKey={(cuota) => cuota.cuotaId}
        />
      </div>
    </div>
  );
}
