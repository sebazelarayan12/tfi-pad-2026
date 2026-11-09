import { BarrasItf } from './BarrasItf';

/** Largo fijo del código de Pago Fácil (`polizas-cuotas-pagofacil.md` §6.3). */
const LONGITUD_CODIGO = 42;
const PATRON_CODIGO = new RegExp(`^\\d{${LONGITUD_CODIGO}}$`);

export const TEXTO_NO_DISPONIBLE = 'No disponible para este importe.';

interface CodigoBarrasProps {
  codigo: string;
}

/**
 * Barras ITF y, debajo, los 42 dígitos como texto opaco (no se parsean, W5 §9). Si el código no
 * tiene 42 dígitos numéricos, no se dibuja nada y se avisa que no está disponible (PB-18).
 */
export function CodigoBarras({ codigo }: CodigoBarrasProps) {
  if (!PATRON_CODIGO.test(codigo)) {
    return <p className="text-center text-body-sm text-text-secondary">{TEXTO_NO_DISPONIBLE}</p>;
  }

  return (
    <div className="flex flex-col items-center gap-sp-8">
      <BarrasItf digitos={codigo} />
      <p
        role="img"
        aria-label={`Código de barras: ${codigo}`}
        className="w-full max-w-[560px] break-all text-center font-mono text-mono text-text-primary"
      >
        {codigo}
      </p>
    </div>
  );
}
