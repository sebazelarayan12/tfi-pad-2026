import type { PagoListadoResponse } from '@nexa/api';

import { VerFacturaPdf } from './VerFacturaPdf';

interface FacturaCellProps {
  pagoId: string;
  factura: PagoListadoResponse['factura'];
}

// El Figma usa `text/tertiary` (3,30:1); para texto informativo se usa `text/secondary` (B11 §14).
const TEXTO_SECUNDARIO = 'text-text-secondary';

/**
 * Columna Factura: número si está autorizada, "Pendiente de CAE" (sin "Reintentar", D-12)
 * con su botón "Ver PDF", o "Sin factura" cuando el pago no tiene factura.
 */
export function FacturaCell({ pagoId, factura }: FacturaCellProps) {
  if (factura === null) return <span className={TEXTO_SECUNDARIO}>Sin factura</span>;
  if (factura.estado === 'PENDIENTE_CAE') {
    return <span className={TEXTO_SECUNDARIO}>Pendiente de CAE</span>;
  }
  return (
    <span className="flex items-center gap-sp-8">
      <span className="font-mono text-mono">{factura.numero}</span>
      <VerFacturaPdf pagoId={pagoId} compacto />
    </span>
  );
}
