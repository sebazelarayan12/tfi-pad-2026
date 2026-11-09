import {
  formatearFechaCalendario,
  formatearImporte,
  isApiError,
  leerMensajeDetalle,
  type CuponPagoFacilResponse,
} from '@nexa/api';
import { AlertaError, Button, toast } from '@nexa/ui';

import {
  ETIQUETA_CODIGO_BARRAS,
  ETIQUETA_PRIMER_VENCIMIENTO,
  ETIQUETA_SEGUNDO_VENCIMIENTO,
  TEXTO_CARGANDO_CUPON,
  TEXTO_CODIGO_COPIADO,
  TEXTO_COPIAR_CODIGO,
  TEXTO_ERROR_COPIAR,
  tituloCuota,
  TITULO_CUPON,
} from '../textosDetalle';

export interface CuponPanelProps {
  cargando: boolean;
  error: unknown;
  cupon: CuponPagoFacilResponse | undefined;
  vigenciaMeses: number;
}

const vencimiento = (importe: number, fecha: string) =>
  `${formatearImporte(importe)} el ${formatearFechaCalendario(fecha)}`;

async function copiar(codigo: string) {
  try {
    await navigator.clipboard.writeText(codigo);
    toast.success(TEXTO_CODIGO_COPIADO);
  } catch {
    toast.error(TEXTO_ERROR_COPIAR);
  }
}

function mensajeDeError(error: unknown): string {
  return isApiError(error) ? leerMensajeDetalle(error).mensaje : 'Ocurrió un error inesperado.';
}

/** Cupón de Pago Fácil de una cuota, solo en pantalla. El código es texto opaco de 42 dígitos. */
export function CuponPanel({ cargando, error, cupon, vigenciaMeses }: CuponPanelProps) {
  const hayError = !cargando && error !== null && error !== undefined;
  const hayCupon = !cargando && !hayError && cupon !== undefined;
  if (!cargando && !hayError && !hayCupon) return null;

  return (
    <section
      aria-labelledby="titulo-cupon"
      className="flex flex-col gap-sp-12 rounded-card border border-border-hairline bg-surface-panel p-sp-24"
    >
      <h3 id="titulo-cupon" className="text-h3 text-text-primary">
        {TITULO_CUPON}
      </h3>
      <div aria-live="polite" className="flex flex-col gap-sp-12">
        {cargando ? (
          <p className="text-body-sm text-text-secondary">{TEXTO_CARGANDO_CUPON}</p>
        ) : null}
        {hayError ? <AlertaError>{mensajeDeError(error)}</AlertaError> : null}
        {hayCupon ? (
          <>
            <p className="text-body-sm text-text-secondary">
              {tituloCuota(cupon.numeroCuota, vigenciaMeses)}
            </p>
            <dl className="grid gap-sp-8 sm:grid-cols-[auto_1fr] sm:gap-x-sp-24">
              <dt className="text-label text-text-secondary">{ETIQUETA_PRIMER_VENCIMIENTO}</dt>
              <dd className="text-body-sm text-text-primary">
                {vencimiento(cupon.importePrimerVencimiento, cupon.fechaPrimerVencimiento)}
              </dd>
              <dt className="text-label text-text-secondary">{ETIQUETA_SEGUNDO_VENCIMIENTO}</dt>
              <dd className="text-body-sm text-text-primary">
                {vencimiento(cupon.importeSegundoVencimiento, cupon.fechaSegundoVencimiento)}
              </dd>
              <dt className="text-label text-text-secondary">{ETIQUETA_CODIGO_BARRAS}</dt>
              <dd className="break-all font-mono text-body-sm text-text-primary">
                {cupon.codigoBarras}
              </dd>
            </dl>
            <div>
              <Button
                label={TEXTO_COPIAR_CODIGO}
                variant="secondary"
                size="s"
                onClick={() => void copiar(cupon.codigoBarras)}
              />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
