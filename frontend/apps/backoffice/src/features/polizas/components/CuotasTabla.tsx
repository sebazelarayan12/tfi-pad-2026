import {
  badgeEnum,
  etiquetaEnum,
  formatearFechaCalendario,
  formatearImporte,
  type CuotaResponse,
} from '@nexa/api';
import { EstadoBadge, Table, type TableColumn } from '@nexa/ui';

import { importeCuota } from '../lib/importeCuota';
import { CAPTION_CUOTAS, NOTA_RECARGO, TEXTO_SIN_CUOTAS, TITULO_CUOTAS } from '../textosDetalle';

interface FilaCuota {
  id: string;
  cuota: string;
  vencimiento: string;
  importe: number;
  estado: number;
}

const COLUMNAS: ReadonlyArray<TableColumn<FilaCuota>> = [
  { key: 'cuota', header: 'Cuota' },
  { key: 'vencimiento', header: 'Vencimiento' },
  {
    key: 'importe',
    header: 'Importe',
    mono: true,
    render: (fila) => formatearImporte(fila.importe),
  },
  {
    key: 'estado',
    header: 'Estado',
    render: (fila) => {
      const badge = badgeEnum('EstadoCuota', fila.estado);
      const etiqueta = etiquetaEnum('EstadoCuota', fila.estado);
      return badge === null ? etiqueta : <EstadoBadge estado={badge} texto={etiqueta} />;
    },
  },
];

interface CuotasTablaProps {
  cuotas: ReadonlyArray<CuotaResponse>;
  vigenciaMeses: number;
}

/** El estado de cada cuota lo devuelve el back; el front no lo calcula a partir de fechas. */
export function CuotasTabla({ cuotas, vigenciaMeses }: CuotasTablaProps) {
  const filas: FilaCuota[] = [...cuotas]
    .sort((a, b) => a.numero - b.numero)
    .map((cuota) => ({
      id: cuota.id,
      cuota: `${cuota.numero} de ${vigenciaMeses}`,
      vencimiento: formatearFechaCalendario(cuota.fechaVencimiento),
      importe: importeCuota(cuota),
      estado: cuota.estado,
    }));

  return (
    <section aria-labelledby="cuotas-titulo" className="flex flex-col gap-sp-12">
      <h2 id="cuotas-titulo" className="text-h3 text-text-primary">
        {TITULO_CUOTAS}
      </h2>
      <p className="text-body-sm text-text-secondary">{NOTA_RECARGO}</p>
      <div className="overflow-hidden rounded-input border border-border-hairline bg-surface-panel">
        <Table caption={CAPTION_CUOTAS} columns={COLUMNAS} rows={filas} getRowKey={(f) => f.id} />
        {filas.length === 0 ? (
          <p className="px-sp-16 py-sp-24 text-center text-body-sm text-text-secondary">
            {TEXTO_SIN_CUOTAS}
          </p>
        ) : null}
      </div>
    </section>
  );
}
