import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError, type EstadoPagoPublico } from '@nexa/api';
import { Button, ButtonLink, Input } from '@nexa/ui';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { ClockIcon } from '@phosphor-icons/react/dist/csr/Clock';
import { HourglassIcon } from '@phosphor-icons/react/dist/csr/Hourglass';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/csr/WarningCircle';
import { XCircleIcon } from '@phosphor-icons/react/dist/csr/XCircle';
import { useMemo, useState, type ReactNode } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { useLocation } from 'react-router-dom';

import { renderLinkPestanaNueva } from '../../../shared/enlace/renderLinkPestanaNueva';
import { renderLinkRouter } from '../../../shared/enlace/renderLinkRouter';
import { leerNumeroPagoEnCurso } from '../api/almacenamientoPago';
import { useFacturaPublica } from '../api/useFacturaPublica';
import { usePagoEnCurso } from '../api/usePagoEnCurso';
import { DetallePago } from '../components/DetallePago';
import { NotaFacturaEnProceso } from '../components/NotaFacturaEnProceso';
import {
  dniVerificacionSchema,
  leerEstadoVerificacion,
  type DniVerificacionValues,
} from '../schemas/estadoVerificacion';

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
  // PADI (pestaña nueva) y pedido del DNI: propuestas pendientes de aprobación de Martin.
  esperaTitulo: 'Completá el pago en PADI',
  esperaSubtitulo:
    'Abrí PADI en una pestaña nueva y pagá. Cuando termines, volvé a esta pestaña y verificá el pago.',
  abrirPadi: 'Abrir PADI para pagar',
  yaPague: 'Ya pagué, verificar',
  dniTitulo: 'Verificá tu pago',
  dniSubtitulo: 'Ingresá el DNI del titular para consultar el estado del pago.',
  dniAyuda: 'Sin puntos ni espacios.',
  verificarPago: 'Verificar pago',
  otroDni: 'Ingresar otro DNI',
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

/**
 * Abre el checkout de PADI en otra pestaña por gesto del usuario (no `window.open` tras un `await`).
 * Al abrirlo empieza el sondeo del estado, así el cliente no tiene que volver a verificar a mano.
 */
function AbrirPadi({ urlPago, onAbrir }: { urlPago: string; onAbrir: () => void }) {
  return (
    <ButtonLink
      label={TEXTOS.abrirPadi}
      href={urlPago}
      variant="secondary"
      renderLink={(propiedades) => renderLinkPestanaNueva({ ...propiedades, onClick: onAbrir })}
    />
  );
}

function NoIdentificado({ onOtroDni }: { onOtroDni?: () => void }) {
  return (
    <ResultadoPago
      tono="neutro"
      icono={<WarningCircleIcon {...ICONO} />}
      titulo={TEXTOS.noIdentificadoTitulo}
      acciones={
        <>
          {onOtroDni ? (
            <Button label={TEXTOS.otroDni} variant="secondary" onClick={onOtroDni} />
          ) : null}
          <BotonConsultarPoliza />
        </>
      }
    />
  );
}

/** DNI del titular cuando no viene en `location.state` (recarga o vuelta desde otra pasarela). */
function PedirDni({ onDni }: { onDni: (dni: string) => void }) {
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<DniVerificacionValues>({
    resolver: zodResolver(dniVerificacionSchema),
    defaultValues: { dni: '' },
  });

  const invalido = (errores: FieldErrors<DniVerificacionValues>) => {
    if (errores.dni) setFocus('dni');
  };

  return (
    <form
      noValidate
      autoComplete="off"
      aria-labelledby="titulo-verificar-dni"
      onSubmit={(evento) => void handleSubmit(({ dni }) => onDni(dni), invalido)(evento)}
      className={TARJETA}
    >
      <div className="flex w-full flex-col gap-sp-8 text-center">
        <h1
          id="titulo-verificar-dni"
          ref={enfocar}
          tabIndex={-1}
          className="text-h1 text-text-primary focus:outline-none"
        >
          {TEXTOS.dniTitulo}
        </h1>
        <p className="text-body text-text-secondary">{TEXTOS.dniSubtitulo}</p>
      </div>
      <div className="w-full">
        <Input
          label="DNI"
          inputMode="numeric"
          autoComplete="off"
          maxLength={8}
          className="font-mono text-mono"
          helper={errors.dni?.message ?? TEXTOS.dniAyuda}
          error={errors.dni !== undefined}
          {...register('dni')}
        />
      </div>
      <div className={ACCIONES}>
        <Button type="submit" label={TEXTOS.verificarPago} />
      </div>
    </form>
  );
}

interface EsperaPadiProps {
  numeroPago: string;
  urlPago: string | null;
  onAbrir: () => void;
  onVerificar: () => void;
}

/**
 * Espera de PADI: el cliente paga en otra pestaña. Desde que la abre la pantalla consulta sola cada
 * pocos segundos y el botón "Ya pagué, verificar" queda como respaldo.
 */
function EsperaPadi({ numeroPago, urlPago, onAbrir, onVerificar }: EsperaPadiProps) {
  return (
    <ResultadoPago
      tono="neutro"
      icono={<HourglassIcon {...ICONO} />}
      titulo={TEXTOS.esperaTitulo}
      subtitulo={TEXTOS.esperaSubtitulo}
      acciones={
        <>
          {urlPago ? <AbrirPadi urlPago={urlPago} onAbrir={onAbrir} /> : null}
          <Button label={TEXTOS.yaPague} onClick={onVerificar} />
        </>
      }
    >
      <DetallePago numeroPago={numeroPago} fechaAcreditacion={null} />
    </ResultadoPago>
  );
}

type Vista =
  | { tipo: 'no-identificado' }
  | { tipo: 'pedir-dni' }
  | { tipo: 'espera-padi'; numeroPago: string }
  | { tipo: 'cargando' }
  | { tipo: 'error'; es429: boolean }
  | { tipo: 'aprobado'; pago: EstadoPagoPublico; dni: string }
  | { tipo: 'pendiente'; pago: EstadoPagoPublico }
  | { tipo: 'rechazado' };

interface EntradaVista {
  numeroPago: string | null;
  dni: string | null;
  solicitada: boolean;
  /** El cliente abrió PADI y la pantalla consulta sola. */
  sondeando: boolean;
  error: unknown;
  pago: EstadoPagoPublico | undefined;
}

/** Qué mostrar según el número de pago, el DNI, si ya se pidió el estado y la respuesta (W-08 §9). */
function resolverVista({
  numeroPago,
  dni,
  solicitada,
  sondeando,
  error,
  pago,
}: EntradaVista): Vista {
  if (numeroPago === null) return { tipo: 'no-identificado' };
  if (dni === null) return { tipo: 'pedir-dni' };
  if (!solicitada && !sondeando) return { tipo: 'espera-padi', numeroPago };
  // Sondeo sin clic del cliente: sigue en la espera mientras no haya error ni cambio de estado.
  if (!solicitada && !error && (pago === undefined || pago.estado === 'PENDIENTE'))
    return { tipo: 'espera-padi', numeroPago };
  if (error) {
    if (isApiError(error) && error.status === 404) return { tipo: 'no-identificado' };
    return { tipo: 'error', es429: isApiError(error) && error.status === 429 };
  }
  if (pago === undefined) return { tipo: 'cargando' };
  if (pago.estado === 'APROBADO') return { tipo: 'aprobado', pago, dni };
  if (pago.estado === 'PENDIENTE') return { tipo: 'pendiente', pago };
  return { tipo: 'rechazado' };
}

interface VolverAConsultarProps {
  consultando: boolean;
  onConsultar: () => void;
  /** Con PADI el botón dice "Ya pagué, verificar". */
  etiqueta: string;
}

/** Reconsulta manual: sin polling ni reintento automático (RN20, FC13). */
function VolverAConsultar({ consultando, onConsultar, etiqueta }: VolverAConsultarProps) {
  return <Button label={etiqueta} disabled={consultando} onClick={onConsultar} />;
}

function Aprobado({ pago, dni }: { pago: EstadoPagoPublico; dni: string }) {
  // La factura se pide solo con el pago aprobado; un 404 deja la nota oculta (DN-W8-5).
  const factura = useFacturaPublica(pago.numeroPago, dni);

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
  urlPadi,
  onAbrir,
  ...reconsulta
}: {
  pago: EstadoPagoPublico;
  urlPadi: string | null;
  onAbrir: () => void;
} & VolverAConsultarProps) {
  return (
    <ResultadoPago
      tono="neutro"
      icono={<HourglassIcon {...ICONO} />}
      titulo={TEXTOS.verificandoTitulo}
      subtitulo={TEXTOS.verificandoSubtitulo}
      acciones={
        <>
          {urlPadi ? <AbrirPadi urlPago={urlPadi} onAbrir={onAbrir} /> : null}
          <VolverAConsultar {...reconsulta} />
        </>
      }
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

interface VerificacionPago {
  vista: Vista;
  urlPadi: string | null;
  reconsulta: VolverAConsultarProps;
  abrirPadi: () => void;
  verificar: () => void;
  cargarDni: (dni: string) => void;
  otroDni: (() => void) | undefined;
}

/**
 * Estado de W6: número de pago (de W4 o de `sessionStorage`), DNI (de W4 o cargado en pantalla) y la
 * consulta de `pagos/estado`, que corre solo cuando el usuario la pide (FC11, FC13).
 */
function useVerificacionPago(): VerificacionPago {
  const { state } = useLocation();
  const desdeW4 = useMemo(() => leerEstadoVerificacion(state), [state]);
  // Se lee una vez: la pantalla no escribe en el storage (FC12).
  const [numeroGuardado] = useState(leerNumeroPagoEnCurso);
  const [dniIngresado, setDniIngresado] = useState<string | null>(null);
  const [solicitada, setSolicitada] = useState(false);
  // Instante en que el cliente abrió PADI; `null` mientras no lo abrió.
  const [sondeoDesde, setSondeoDesde] = useState<number | null>(null);

  const numeroPago = desdeW4?.numeroPago ?? numeroGuardado;
  const dni = desdeW4?.dni ?? dniIngresado;
  const sondeando = sondeoDesde !== null;
  const estado = usePagoEnCurso(
    numeroPago,
    dni,
    solicitada || sondeando,
    sondeoDesde === null ? null : { desde: sondeoDesde },
  );
  const vista = resolverVista({
    numeroPago,
    dni,
    solicitada,
    sondeando,
    error: estado.error,
    pago: estado.data,
  });

  const abrirPadi = () => setSondeoDesde((desde) => desde ?? Date.now());
  const verificar = () => {
    if (solicitada || sondeando) void estado.refetch();
    setSolicitada(true);
  };
  const cargarDni = (valor: string) => {
    setDniIngresado(valor);
    setSolicitada(true);
  };
  const limpiarDni = () => {
    setDniIngresado(null);
    setSolicitada(false);
  };

  return {
    vista,
    urlPadi: desdeW4 ? (estado.data?.urlPago ?? desdeW4.urlPago) : null,
    reconsulta: {
      consultando: estado.isFetching,
      onConsultar: verificar,
      etiqueta: desdeW4 ? TEXTOS.yaPague : TEXTOS.volverAConsultar,
    },
    abrirPadi,
    verificar,
    cargarDni,
    otroDni: desdeW4 === null && dniIngresado !== null ? limpiarDni : undefined,
  };
}

/** Elige la tarjeta de W6 según la vista resuelta. */
function ContenidoPago({
  vista,
  urlPadi,
  reconsulta,
  abrirPadi,
  verificar,
  cargarDni,
  otroDni,
}: VerificacionPago) {
  switch (vista.tipo) {
    case 'no-identificado':
      return <NoIdentificado onOtroDni={otroDni} />;
    case 'pedir-dni':
      return <PedirDni onDni={cargarDni} />;
    case 'espera-padi':
      return (
        <EsperaPadi
          numeroPago={vista.numeroPago}
          urlPago={urlPadi}
          onAbrir={abrirPadi}
          onVerificar={verificar}
        />
      );
    case 'cargando':
      return <EsqueletoResultado />;
    case 'error':
      return <ErrorConsulta es429={vista.es429} {...reconsulta} />;
    case 'aprobado':
      return <Aprobado pago={vista.pago} dni={vista.dni} />;
    case 'pendiente':
      return <Pendiente pago={vista.pago} urlPadi={urlPadi} onAbrir={abrirPadi} {...reconsulta} />;
    case 'rechazado':
      return <Rechazado />;
  }
}

/**
 * Pantalla W6 `/pago/exito`: espera y verificación del pago. Con PADI llega desde W4 con número de
 * pago, DNI y link en `location.state`; al volver de otra pasarela usa el `numeroPago` que guardó W4
 * y pide el DNI (RV-D17, decisión de Martin: número de pago + DNI). El DNI nunca va a storage (FC12).
 * El estado se pide por acción del usuario ("Ya pagué, verificar", el DNI cargado o abrir PADI, que además
 * activa el sondeo cada 10 s; FC11, FC13).
 */
export function PagoAprobadoPage() {
  const verificacion = useVerificacionPago();

  return (
    <div className="flex flex-1 items-start justify-center py-sp-24 md:py-sp-40">
      <ContenidoPago {...verificacion} />
    </div>
  );
}
