import { formatearFechaHora } from '@nexa/api';

export interface DetallePagoProps {
  /** `PAG-xxxxxx` del back; no la referencia de la pasarela (DN-W8-1, D-22). */
  numeroPago: string;
  /** ISO UTC; sin fecha la fila no se muestra. */
  fechaAcreditacion: string | null;
}

const FILA = 'flex items-center justify-between gap-sp-16 py-sp-16';
const ETIQUETA = 'text-body-sm text-text-secondary';

/**
 * Detalle del pago (W6 nodo 18:2343). "Total pagado" y "Cuotas" no se muestran porque el back no
 * los expone en el retorno (DN-W8-2, DN-W8-3).
 */
export function DetallePago({ numeroPago, fechaAcreditacion }: DetallePagoProps) {
  return (
    <dl className="flex w-full flex-col divide-y divide-border-hairline">
      <div className={FILA}>
        <dt className={ETIQUETA}>Número de operación</dt>
        <dd className="font-mono text-mono text-text-primary">{numeroPago}</dd>
      </div>
      {fechaAcreditacion ? (
        <div className={FILA}>
          <dt className={ETIQUETA}>Fecha</dt>
          <dd className="text-body text-text-primary">{formatearFechaHora(fechaAcreditacion)}</dd>
        </div>
      ) : null}
    </dl>
  );
}
