import { ClockIcon } from '@phosphor-icons/react/dist/csr/Clock';

// W6 §5. La segunda frase ("Te la enviamos por email…") queda afuera hasta confirmar el envío (DN-W8-6).
export const TEXTO_FACTURA_EN_PROCESO = 'La factura está en proceso (Pendiente de CAE).';

/** Nota de factura pendiente de CAE (W6 nodo 18:2362): frame propio con `accent-promo`. */
export function NotaFacturaEnProceso() {
  return (
    <p className="flex w-full items-start gap-sp-12 rounded-card bg-accent-promo p-sp-16 text-body text-text-primary">
      <span aria-hidden="true" className="shrink-0">
        <ClockIcon size={20} weight="regular" />
      </span>
      {TEXTO_FACTURA_EN_PROCESO}
    </p>
  );
}
