import { AlertaError, Button } from '@nexa/ui';

import { useAbrirFacturaPdf } from '../api/usePagos';

export interface VerFacturaPdfProps {
  pagoId: string;
}

/** Abre el PDF de la factura autorizada de un pago en una pestaña nueva. */
export function VerFacturaPdf({ pagoId }: VerFacturaPdfProps) {
  const { abrir, abriendo, fallo } = useAbrirFacturaPdf(pagoId);

  return (
    <div>
      <Button
        label={abriendo ? 'Abriendo PDF…' : 'Ver PDF'}
        variant="secondary"
        disabled={abriendo}
        onClick={() => void abrir()}
      />
      {fallo ? (
        <AlertaError>No se pudo abrir el PDF de la factura. Probá de nuevo.</AlertaError>
      ) : null}
    </div>
  );
}
