import { etiquetaEnum, formatearFechaHora, formatearImporte, TEXTO_SIN_DATO } from '@nexa/api';
import type { PagoResponse } from '@nexa/api';

import { EstadoFacturaBadge } from '../../pagos';

/** Solo la fecha (`dd/mm/aaaa`) del `fechaCreacion` UTC, en hora de Argentina (FB4). */
const soloFecha = (valor: string) => formatearFechaHora(valor).split(' ')[0] ?? TEXTO_SIN_DATO;

/** Una fila del widget Pagos: fecha, importe, medio y badge de factura. Sin acción de clic (D-B18-05). */
export function PagoResumenItem({ pago }: { pago: PagoResponse }) {
  return (
    <li className="flex items-center justify-between gap-sp-8">
      <div className="flex min-w-0 flex-col gap-sp-4">
        <span className="font-mono text-mono text-text-primary">
          {formatearImporte(pago.importe)}
        </span>
        <span className="text-caption text-text-secondary">
          {soloFecha(pago.fechaCreacion)} · {etiquetaEnum('MedioPago', pago.medio)}
        </span>
      </div>
      {pago.factura ? <EstadoFacturaBadge estado={pago.factura.estado} /> : null}
    </li>
  );
}
