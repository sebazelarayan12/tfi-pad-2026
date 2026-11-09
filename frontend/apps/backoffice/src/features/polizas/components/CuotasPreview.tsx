import { formatearImporte } from '@nexa/api';
import { EstadoBadge, Table, type TableColumn } from '@nexa/ui';
import type { VigenciaMeses } from '../schemas/emisionSchema';

interface CuotaPrevia {
  numero: number;
  cuota: string;
  vencimiento: string;
  importe: string;
  estado: 'Pendiente';
}

const columnas: TableColumn<CuotaPrevia>[] = [
  { key: 'cuota', header: 'Cuota' },
  { key: 'vencimiento', header: 'Vencimiento' },
  { key: 'importe', header: 'Importe', mono: true },
  { key: 'estado', header: 'Estado', render: ({ estado }) => <EstadoBadge estado={estado} /> },
];

export function CuotasPreview({
  vigencia,
  prima,
}: {
  vigencia: VigenciaMeses | null;
  prima: number;
}) {
  const importe = formatearImporte(prima);
  const cuotas = Array.from({ length: vigencia ?? 0 }, (_, indice): CuotaPrevia => ({
    numero: indice + 1,
    cuota: indice + 1 + ' de ' + vigencia,
    vencimiento: 'A confirmar',
    importe,
    estado: 'Pendiente',
  }));

  return (
    <section className="flex flex-col gap-sp-12">
      <h2 className="text-h3 text-text-primary">Cuotas que se generan</h2>
      <p className="text-body-sm text-text-secondary">Fechas a confirmar: se muestran al emitir.</p>
      <div className="overflow-x-auto rounded-input border border-border-hairline bg-surface-panel">
        <div className="min-w-[440px]">
          <Table
            caption="Cuotas que se generan"
            columns={columnas}
            rows={cuotas}
            getRowKey={({ numero }) => String(numero)}
          />
          {vigencia === null ? null : (
            <p className="grid grid-cols-4 items-baseline px-sp-16 py-sp-12 text-body-sm text-text-primary">
              <strong>Total</strong>
              <span>
                {vigencia} {vigencia === 1 ? 'cuota' : 'cuotas'}
              </span>
              <strong className="col-span-2 font-mono text-mono-lg font-medium">
                {formatearImporte(vigencia * prima)}
              </strong>
            </p>
          )}
        </div>
      </div>
      {vigencia === null ? (
        <p className="text-body-sm text-text-secondary">Elegí una vigencia para ver las cuotas.</p>
      ) : null}
    </section>
  );
}
