import { formatearFechaHora, isApiError, parsearFechaUtc, type CotizacionDto } from '@nexa/api';
import { AlertaError, ButtonLink, Input } from '@nexa/ui';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { useCallback, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useRol } from '../../auth';
import { detalleEmision } from '../api/detalleEmision';
import { useCotizacionEmision } from '../api/useCotizacionEmision';
import { useEmitirPoliza } from '../api/useEmitirPoliza';
import { AccionesEmision } from '../components/AccionesEmision';
import { CotizacionResumen } from '../components/CotizacionResumen';
import { CuotasPreview } from '../components/CuotasPreview';
import { EmisionNota } from '../components/EmisionNota';
import { ValidacionesPanel } from '../components/ValidacionesPanel';
import { VigenciaSelector } from '../components/VigenciaSelector';
import { cotizacionIdSchema, emisionSchema, type VigenciaMeses } from '../schemas/emisionSchema';

const COTIZACION_VENCIDA = 'La cotización está vencida (RN06).';
const ERROR_RUTA = 'No se pudo abrir la emisión. Volvé a la cotización.';

function rutaCotizacion(cotizacion?: CotizacionDto) {
  if (!cotizacion?.vehiculoId) return '/clientes';
  const query = new URLSearchParams({ vehiculoId: cotizacion.vehiculoId });
  if (cotizacion.clienteId) query.set('clienteId', cotizacion.clienteId);
  return '/cotizaciones/nueva?' + query.toString();
}

function VolverCotizacion({ ruta }: { ruta: string }) {
  return (
    <ButtonLink
      label="Cotización"
      href={ruta}
      variant="ghost"
      size="s"
      icon={<ArrowLeftIcon size={16} />}
      renderLink={({ href, ...props }) => <Link to={href} {...props} />}
    />
  );
}

function ErrorEmision({ mensaje, ruta = '/clientes' }: { mensaje: string; ruta?: string }) {
  return (
    <>
      <div>
        <VolverCotizacion ruta={ruta} />
      </div>
      <AlertaError>{mensaje}</AlertaError>
    </>
  );
}

function CargandoEmision() {
  return (
    <div role="status" className="flex flex-col gap-sp-16">
      <span className="sr-only">Cargando cotización…</span>
      <div
        aria-hidden="true"
        className="h-32 rounded-card bg-surface-subtle motion-safe:animate-pulse"
      />
      <div
        aria-hidden="true"
        className="h-48 rounded-card bg-surface-subtle motion-safe:animate-pulse"
      />
      <AccionesEmision habilitada={false} emitiendo={false} cargando onCancelar={() => {}} />
    </div>
  );
}

function useVigente(limite: number) {
  const consultar = useCallback(() => Date.now() <= limite, [limite]);
  const suscribir = useCallback(
    (avisar: () => void) => {
      if (!consultar()) return () => {};
      // RN06: la validez máxima es de quince días.
      const timer = window.setTimeout(avisar, Math.max(0, limite - Date.now() + 1));
      return () => window.clearTimeout(timer);
    },
    [consultar, limite],
  );
  return useSyncExternalStore(suscribir, consultar);
}

type DatosRelacionados = Omit<ReturnType<typeof useCotizacionEmision>, 'cotizacion'>;

function FormularioEmision({
  datos,
  asociados,
}: {
  datos: CotizacionDto;
  asociados: DatosRelacionados;
}) {
  const navegar = useNavigate();
  const emision = useEmitirPoliza();
  const [vigencia, setVigencia] = useState<VigenciaMeses | null>(null);
  const [fechaInicio] = useState(() => formatearFechaHora(new Date().toISOString()).split(' ')[0]);
  const enviando = useRef(false);
  const regreso = rutaCotizacion(datos);
  const limite = parsearFechaUtc(datos.fechaVencimiento)?.getTime() ?? 0;
  const vigente = useVigente(limite);
  const disponibles = Boolean(asociados.vehiculo.data && asociados.plan.data);
  const errorPost = emision.isError
    ? detalleEmision(emision.error, 'No se pudo emitir la póliza. Intentá de nuevo.')
    : undefined;
  const error = errorPost ?? (vigente ? undefined : COTIZACION_VENCIDA);
  const habilitada =
    disponibles &&
    vigente &&
    errorPost !== COTIZACION_VENCIDA &&
    vigencia !== null &&
    !emision.isPending;

  function emitir(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!habilitada || enviando.current || Date.now() > limite) return;
    const solicitud = emisionSchema.safeParse({ vigenciaMeses: vigencia });
    if (!solicitud.success) return;
    enviando.current = true;
    emision.mutate(
      { cotizacionId: datos.id, ...solicitud.data },
      {
        onSuccess: ({ id, numero }) => {
          void navegar('/polizas/' + encodeURIComponent(id), {
            state: { aviso: { tipo: 'exito', texto: 'Póliza ' + numero + ' emitida.' } },
          });
        },
        onSettled: () => {
          enviando.current = false;
        },
      },
    );
  }

  if (isApiError(emision.error) && emision.error.status === 404) {
    return <ErrorEmision mensaje={errorPost ?? ERROR_RUTA} ruta={regreso} />;
  }

  return (
    <>
      <div>
        <VolverCotizacion ruta={regreso} />
      </div>
      <form
        onSubmit={emitir}
        className="flex min-w-0 flex-col gap-sp-24 xl:flex-row xl:items-start"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-sp-24">
          <CotizacionResumen datos={datos} {...asociados} />
          <section className="flex flex-col items-start gap-sp-16 rounded-card border border-border-hairline bg-surface-panel p-sp-20">
            <VigenciaSelector
              valor={vigencia}
              onElegir={setVigencia}
              disabled={emision.isPending}
            />
            <Input label="Fecha de inicio" value={fechaInicio} readOnly />
          </section>
          <CuotasPreview vigencia={vigencia} prima={datos.primaMensual} />
        </div>
        <aside
          aria-label="Validaciones y acciones"
          className="flex w-full flex-col gap-sp-16 xl:w-[300px] xl:shrink-0"
        >
          <ValidacionesPanel />
          <EmisionNota error={error} />
          <AccionesEmision
            habilitada={habilitada}
            emitiendo={emision.isPending}
            onCancelar={() => void navegar(regreso)}
          />
        </aside>
      </form>
    </>
  );
}

function EmisionPorCotizacion({ id }: { id: string }) {
  const { cotizacion, ...asociados } = useCotizacionEmision(id);
  if (cotizacion.isPending || asociados.vehiculo.isLoading || asociados.plan.isLoading) {
    return <CargandoEmision />;
  }
  if (cotizacion.isError) {
    return <ErrorEmision mensaje={detalleEmision(cotizacion.error, ERROR_RUTA)} />;
  }
  return <FormularioEmision datos={cotizacion.data} asociados={asociados} />;
}

export function EmitirPolizaPage() {
  const rol = useRol();
  const [query] = useSearchParams();
  if (rol !== 'Empleado' && rol !== 'Administrador') {
    return <p className="text-text-primary">No tenés permiso para esta acción.</p>;
  }
  const id = cotizacionIdSchema.safeParse(query.get('cotizacionId'));
  return (
    <section aria-label="Emitir póliza" className="flex min-w-0 flex-col gap-sp-24">
      {id.success ? (
        <EmisionPorCotizacion key={id.data} id={id.data} />
      ) : (
        <ErrorEmision mensaje={ERROR_RUTA} />
      )}
    </section>
  );
}
