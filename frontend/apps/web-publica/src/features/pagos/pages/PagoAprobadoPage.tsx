import { isApiError, type EstadoPagoPublicoMock } from '@nexa/api';
import { Button, ButtonLink } from '@nexa/ui';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { ClockIcon } from '@phosphor-icons/react/dist/csr/Clock';
import { HourglassIcon } from '@phosphor-icons/react/dist/csr/Hourglass';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/csr/WarningCircle';
import { XCircleIcon } from '@phosphor-icons/react/dist/csr/XCircle';
import { useState, type ReactNode } from 'react';

import { renderLinkRouter } from '../../../shared/enlace/renderLinkRouter';
import { leerNumeroPagoEnCurso } from '../api/almacenamientoPago';
import { useFacturaPublica } from '../api/useFacturaPublica';
import { usePagoEnCurso } from '../api/usePagoEnCurso';
import { DetallePago } from '../components/DetallePago';
import { NotaFacturaEnProceso } from '../components/NotaFacturaEnProceso';

// "Volver a mi póliza" lleva a W2: W3 necesita DNI y número de póliza, que la web no guarda (DN-W8-4).
const RUTA_CONSULTA = '/consultar-poliza';

// Textos de W-08 §8. Los de verificando, rechazado, no identificado y error son propuestas
// (NO DEFINIDOS en el Figma, W6 D2); el del 429 es el literal de W2.
const TEXTOS = {
  aprobadoTitulo: 'Pago aprobado',
  aprobadoSubtitulo: 'Tu pago está registrado.',
  volverAMiPoliza: 'Volver a mi póliza',
  verificandoTitulo: 'Verificando el pago',
  verificandoSubtitulo:
    'Todavía no recibimos la confirmación de la pasarela. Podés volver a consultar en unos minutos.',
  volverAConsultar: 'Volver a consultar',
  rechazadoTitulo: 'El pago no se pudo confirmar.',
  noIdentificadoTitulo: 'No pudimos identificar tu pago.',
  consultarPoliza: 'Consultar póliza',
  errorTitulo: 'No pudimos consultar el estado del pago.',
  errorGenerico: 'Intentá de nuevo en unos minutos.',
  error429: 'Hiciste muchos intentos. Esperá un minuto y volvé a probar.',
  cargando: 'Consultando el estado del pago…',
} as const;

type Tono = 'exito' | 'neutro' | 'error' | 'aviso';

const TONOS: Record<Tono, string> = {
  exito: 'bg-status-vigente-bg text-status-vigente-text',
  neutro: 'bg-surface-subtle text-text-secondary',
  error: 'bg-status-cancelada-bg text-status-cancelada-text',
  aviso: 'bg-status-suspendida-bg text-status-suspendida-text',
};

const TARJETA =
  'flex w-full max-w-[640px] flex-col items-center gap-sp-24 rounded-card border border-border-hairline bg-surface-panel p-sp-24 md:p-sp-40';
const ACCIONES = 'flex w-full flex-col gap-sp-12 sm:w-auto sm:flex-row sm:justify-center';

/** Lleva el foco al `h1` cuando aparece un resultado nuevo (FC16). Identidad estable a propósito. */
function enfocar(nodo: HTMLHeadingElement | null) {
  nodo?.focus();
}

interface ResultadoPagoProps {
  tono: Tono;
  icono: ReactNode;
  titulo: string;
  subtitulo?: string;
  children?: ReactNode;
  acciones: ReactNode;
}

/** Tarjeta de 640 px de W6 (nodo 18:2337): círculo de 72 px, título, subtítulo, contenido y acciones. */
function ResultadoPago({ tono, icono, titulo, subtitulo, children, acciones }: ResultadoPagoProps) {
  return (
    <section aria-labelledby="titulo-resultado-pago" className={TARJETA}>
      <div role="status" className="flex flex-col items-center gap-sp-24 text-center">
        <span
          aria-hidden="true"
          className={`flex size-[72px] items-center justify-center rounded-pill ${TONOS[tono]}`}
        >
          {icono}
        </span>
        <h1
          id="titulo-resultado-pago"
          ref={enfocar}
          tabIndex={-1}
          className="text-h1 text-text-primary focus:outline-none"
        >
          {titulo}
        </h1>
        {subtitulo ? <p className="text-body text-text-secondary">{subtitulo}</p> : null}
      </div>
      {children}
      <div className={ACCIONES}>{acciones}</div>
    </section>
  );
}

function EsqueletoResultado() {
  return (
    <div aria-busy="true" className={TARJETA}>
      <p role="status" className="sr-only">
        {TEXTOS.cargando}
      </p>
      <span className="size-[72px] rounded-pill bg-surface-subtle motion-safe:animate-pulse" />
      <span className="h-sp-32 w-1/2 rounded-input bg-surface-subtle motion-safe:animate-pulse" />
      <span className="h-sp-20 w-2/3 rounded-input bg-surface-subtle motion-safe:animate-pulse" />
      <span className="h-sp-48 w-full rounded-input bg-surface-subtle motion-safe:animate-pulse" />
    </div>
  );
}

const ICONO = { size: 40, weight: 'regular' } as const;

function BotonConsultarPoliza() {
  return (
    <ButtonLink label={TEXTOS.consultarPoliza} href={RUTA_CONSULTA} renderLink={renderLinkRouter} />
  );
}

function NoIdentificado() {
  return (
    <ResultadoPago
      tono="neutro"
      icono={<WarningCircleIcon {...ICONO} />}
      titulo={TEXTOS.noIdentificadoTitulo}
      acciones={<BotonConsultarPoliza />}
    />
  );
}

type Vista =
  | { tipo: 'no-identificado' }
  | { tipo: 'cargando' }
  | { tipo: 'error'; es429: boolean }
  | { tipo: 'aprobado'; pago: EstadoPagoPublicoMock }
  | { tipo: 'pendiente'; pago: EstadoPagoPublicoMock }
  | { tipo: 'rechazado' };

/** Qué mostrar según el `numeroPago` guardado y la respuesta de `pagos/estado` (W-08 §9). */
function resolverVista(
  numeroPago: string | null,
  error: unknown,
  pago: EstadoPagoPublicoMock | undefined,
): Vista {
  if (numeroPago === null) return { tipo: 'no-identificado' };
  if (error) {
    if (isApiError(error) && error.status === 404) return { tipo: 'no-identificado' };
    return { tipo: 'error', es429: isApiError(error) && error.status === 429 };
  }
  if (pago === undefined) return { tipo: 'cargando' };
  if (pago.estado === 'APROBADO') return { tipo: 'aprobado', pago };
  if (pago.estado === 'PENDIENTE') return { tipo: 'pendiente', pago };
  return { tipo: 'rechazado' };
}

interface VolverAConsultarProps {
  consultando: boolean;
  onConsultar: () => void;
}

/** Reconsulta manual: sin polling ni reintento automático (RN20, FC13). */
function VolverAConsultar({ consultando, onConsultar }: VolverAConsultarProps) {
  return <Button label={TEXTOS.volverAConsultar} disabled={consultando} onClick={onConsultar} />;
}

function Aprobado({ pago }: { pago: EstadoPagoPublicoMock }) {
  // La factura se pide solo con el pago aprobado; un 404 deja la nota oculta (DN-W8-5).
  const factura = useFacturaPublica(pago.numeroPago);

  return (
    <ResultadoPago
      tono="exito"
      icono={<CheckCircleIcon {...ICONO} />}
      titulo={TEXTOS.aprobadoTitulo}
      subtitulo={TEXTOS.aprobadoSubtitulo}
      acciones={
        <ButtonLink
          label={TEXTOS.volverAMiPoliza}
          href={RUTA_CONSULTA}
          icon={<ArrowLeftIcon size={16} weight="regular" />}
          renderLink={renderLinkRouter}
        />
      }
    >
      <DetallePago numeroPago={pago.numeroPago} fechaAcreditacion={pago.fechaAcreditacion} />
      {factura.data?.estado === 'PENDIENTE_CAE' ? <NotaFacturaEnProceso /> : null}
    </ResultadoPago>
  );
}

function Pendiente({
  pago,
  ...reconsulta
}: { pago: EstadoPagoPublicoMock } & VolverAConsultarProps) {
  return (
    <ResultadoPago
      tono="neutro"
      icono={<HourglassIcon {...ICONO} />}
      titulo={TEXTOS.verificandoTitulo}
      subtitulo={TEXTOS.verificandoSubtitulo}
      acciones={<VolverAConsultar {...reconsulta} />}
    >
      <DetallePago numeroPago={pago.numeroPago} fechaAcreditacion={null} />
    </ResultadoPago>
  );
}

function ErrorConsulta({ es429, ...reconsulta }: { es429: boolean } & VolverAConsultarProps) {
  return (
    <ResultadoPago
      tono={es429 ? 'aviso' : 'neutro'}
      icono={es429 ? <ClockIcon {...ICONO} /> : <WarningCircleIcon {...ICONO} />}
      titulo={TEXTOS.errorTitulo}
      subtitulo={es429 ? TEXTOS.error429 : TEXTOS.errorGenerico}
      acciones={<VolverAConsultar {...reconsulta} />}
    />
  );
}

function Rechazado() {
  return (
    <ResultadoPago
      tono="error"
      icono={<XCircleIcon {...ICONO} />}
      titulo={TEXTOS.rechazadoTitulo}
      acciones={<BotonConsultarPoliza />}
    />
  );
}

/**
 * Pantalla W6 `/pago/exito` (retorno de la pasarela). Identifica el pago solo por el `numeroPago`
 * que guardó W4 (DB-W8-1 opción A, RV-D17); nunca lee ni escribe el DNI (FC12).
 */
export function PagoAprobadoPage() {
  // Se lee una vez: la pantalla no escribe en el storage (FC12).
  const [numeroPago] = useState(leerNumeroPagoEnCurso);
  const estado = usePagoEnCurso(numeroPago);
  const vista = resolverVista(numeroPago, estado.error, estado.data);
  const reconsulta: VolverAConsultarProps = {
    consultando: estado.isFetching,
    onConsultar: () => void estado.refetch(),
  };

  return (
    <div className="flex flex-1 items-center justify-center py-sp-24 md:py-sp-40">
      {vista.tipo === 'no-identificado' ? <NoIdentificado /> : null}
      {vista.tipo === 'cargando' ? <EsqueletoResultado /> : null}
      {vista.tipo === 'error' ? <ErrorConsulta es429={vista.es429} {...reconsulta} /> : null}
      {vista.tipo === 'aprobado' ? <Aprobado pago={vista.pago} /> : null}
      {vista.tipo === 'pendiente' ? <Pendiente pago={vista.pago} {...reconsulta} /> : null}
      {vista.tipo === 'rechazado' ? <Rechazado /> : null}
    </div>
  );
}
