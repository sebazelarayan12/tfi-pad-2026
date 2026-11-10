import {
  formatearDni,
  formatearFechaCalendario,
  formatearImporte,
  isApiError,
  type CuponPagoFacilResponse,
} from '@nexa/api';
import { AlertaError, Button, LogoNexa } from '@nexa/ui';

import { CodigoBarras, TEXTO_NO_DISPONIBLE } from './CodigoBarras';

// Textos de W-07 §8 (propuestas aprobadas, DN-W7-8). El 429 es el literal de W2.
const ERROR_NO_PAGABLE = 'Esta cuota no se puede pagar con cupón.';
const ERROR_NO_ENCONTRADO = 'No pudimos generar el cupón. Volvé a consultar tu póliza.';
const ERROR_429 = 'Hiciste muchos intentos. Esperá un minuto y volvé a probar.';
const ERROR_GENERICO = 'No pudimos generar el cupón.';

/** Mensaje del back cuando el importe no entra en el código (PB-18, `CodigoBarrasPagoFacil`). */
const DESBORDE_IMPORTE = /no entra en el c[oó]digo/i;

interface MensajeError {
  texto: string;
  /** "Reintentar" solo por clic (DN-W7-4); un 400 no cambia al reintentar. */
  reintentable: boolean;
}

function mensajeDeError(error: unknown): MensajeError {
  if (isApiError(error) && error.kind === 'http') {
    if (error.status === 400) {
      const desborde = DESBORDE_IMPORTE.test(error.detail ?? '');
      return { texto: desborde ? TEXTO_NO_DISPONIBLE : ERROR_NO_PAGABLE, reintentable: false };
    }
    if (error.status === 404) return { texto: ERROR_NO_ENCONTRADO, reintentable: true };
    if (error.status === 429) return { texto: ERROR_429, reintentable: true };
  }
  return { texto: ERROR_GENERICO, reintentable: true };
}

const TARJETA =
  'flex w-full max-w-[720px] flex-col gap-sp-24 rounded-card border border-border-hairline bg-surface-panel p-sp-20 md:p-sp-40 print:max-w-none print:break-inside-avoid';

interface CuponPagoFacilProps {
  numeroPoliza: string;
  dni: string;
  numeroCuota: number;
  /** Cantidad de cuotas de la póliza, de la consulta (DN-W7-7). */
  totalCuotas: number;
  cupon: CuponPagoFacilResponse | undefined;
  cargando: boolean;
  reintentando: boolean;
  error: unknown;
  onReintentar: () => void;
}

/** Fila etiqueta/valor; póliza y DNI van en Mono como en el Figma (nodo 18:2102). */
function Fila({
  etiqueta,
  valor,
  mono = false,
}: {
  etiqueta: string;
  valor: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-sp-12 text-body-sm">
      <dt className="text-text-secondary">{etiqueta}</dt>
      <dd className={`text-right text-text-primary ${mono ? 'font-mono text-mono' : ''}`}>
        {valor}
      </dd>
    </div>
  );
}

function Vencimiento({
  titulo,
  fecha,
  importe,
}: {
  titulo: string;
  fecha: string;
  importe: number;
}) {
  return (
    <div className="flex flex-1 flex-col gap-sp-4 rounded-input bg-surface-subtle p-sp-16">
      <p className="text-caption text-text-secondary">{titulo}</p>
      <p className="text-body text-text-primary">{formatearFechaCalendario(fecha)}</p>
      <p className="font-mono text-mono-lg text-text-primary">{formatearImporte(importe)}</p>
    </div>
  );
}

/**
 * Un cupón de Pago Fácil (W5 §3): datos, dos vencimientos del DTO (nunca los del Figma, PB-21) y el
 * código. Sin "Titular" (PB-07, D-10). Cada tarjeta maneja su propia carga y su propio error.
 */
export function CuponPagoFacil({
  numeroPoliza,
  dni,
  numeroCuota,
  totalCuotas,
  cupon,
  cargando,
  reintentando,
  error,
  onReintentar,
}: CuponPagoFacilProps) {
  const etiquetaCuota = `${numeroCuota} de ${totalCuotas}`;
  const titulo = `Cuota ${etiquetaCuota}`;

  return (
    <article aria-label={titulo} aria-busy={cargando} className={TARJETA}>
      <LogoNexa />
      <dl className="flex flex-col gap-sp-12">
        <Fila etiqueta="Póliza" valor={numeroPoliza} mono />
        <Fila etiqueta="Cuota" valor={etiquetaCuota} />
        <Fila etiqueta="DNI" valor={formatearDni(dni)} mono />
      </dl>
      <hr className="border-border-hairline" />

      {cupon ? (
        <>
          <div className="flex flex-col gap-sp-16 sm:flex-row">
            <Vencimiento
              titulo="1er vencimiento"
              fecha={cupon.fechaPrimerVencimiento}
              importe={cupon.importePrimerVencimiento}
            />
            <Vencimiento
              titulo="2do vencimiento, con recargo 5%"
              fecha={cupon.fechaSegundoVencimiento}
              importe={cupon.importeSegundoVencimiento}
            />
          </div>
          <CodigoBarras codigo={cupon.codigoBarras} />
        </>
      ) : null}

      {cargando ? (
        <div className="flex flex-col gap-sp-16">
          <span className="sr-only">Cargando cupón…</span>
          <div
            aria-hidden="true"
            className="h-[124px] animate-pulse rounded-input bg-surface-subtle"
          />
          <div
            aria-hidden="true"
            className="h-[98px] animate-pulse rounded-input bg-surface-subtle"
          />
        </div>
      ) : null}

      {!cupon && !cargando && error ? (
        <ErrorCupon error={error} reintentando={reintentando} onReintentar={onReintentar} />
      ) : null}
    </article>
  );
}

function ErrorCupon({
  error,
  reintentando,
  onReintentar,
}: {
  error: unknown;
  reintentando: boolean;
  onReintentar: () => void;
}) {
  const { texto, reintentable } = mensajeDeError(error);

  return (
    <div className="flex flex-col items-start gap-sp-12">
      <AlertaError>{texto}</AlertaError>
      {reintentable ? (
        <Button
          label="Reintentar"
          variant="secondary"
          size="s"
          disabled={reintentando}
          onClick={onReintentar}
          className="print:hidden"
        />
      ) : null}
    </div>
  );
}
