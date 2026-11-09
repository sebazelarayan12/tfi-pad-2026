import { isApiError, type PolizaDetalleResponse } from '@nexa/api';
import { AlertaError, Button, ButtonLink } from '@nexa/ui';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { Link, useParams } from 'react-router-dom';

import { useClienteDatos } from '../api/useClienteDatos';
import { esIdValido, usePolizaDetalle } from '../api/usePolizaDetalle';
import { useVehiculoAnio } from '../api/useVehiculoAnio';
import { AvisoSuspension } from '../components/AvisoSuspension';
import { CicloDeVida } from '../components/CicloDeVida';
import { CuotasTabla } from '../components/CuotasTabla';
import { PolizaAcciones } from '../components/PolizaAcciones';
import { PolizaDatos } from '../components/PolizaDatos';
import { PolizaEncabezado } from '../components/PolizaEncabezado';
import { PolizaRail } from '../components/PolizaRail';
import { cicloDeVida } from '../lib/cicloDeVida';
import {
  ETIQUETA_COLUMNA_DERECHA,
  mensajeNoExiste,
  TEXTO_ERROR_DETALLE,
  TEXTO_SIN_PERMISO,
  TEXTO_VOLVER_POLIZAS,
} from '../textosDetalle';

const ESTADO_SUSPENDIDA = 2;
const RUTA_POLIZAS = '/polizas';

const enlaceVolver = (
  <ButtonLink
    label={TEXTO_VOLVER_POLIZAS}
    href={RUTA_POLIZAS}
    variant="ghost"
    size="s"
    icon={<ArrowLeftIcon size={16} />}
    renderLink={({ href, ...props }) => <Link to={href} {...props} />}
  />
);

function Mensaje({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col items-start gap-sp-16 rounded-card border border-border-hairline bg-surface-panel p-sp-24">
      <p className="text-body-sm text-text-secondary">{texto}</p>
    </div>
  );
}

function Esqueleto() {
  return (
    <div aria-hidden="true" data-testid="esqueleto-detalle" className="flex flex-col gap-sp-16">
      <span className="h-8 w-64 max-w-full rounded-input bg-surface-subtle motion-safe:animate-pulse" />
      <span className="h-16 rounded-input bg-surface-subtle motion-safe:animate-pulse" />
      <span className="h-48 rounded-input bg-surface-subtle motion-safe:animate-pulse" />
      <span className="h-64 rounded-input bg-surface-subtle motion-safe:animate-pulse" />
    </div>
  );
}

function DetalleCargado({ poliza }: { poliza: PolizaDetalleResponse }) {
  const cliente = useClienteDatos(poliza.clienteId);
  const vehiculo = useVehiculoAnio(poliza.vehiculoId);
  const ciclo = cicloDeVida(poliza);
  return (
    <div className="flex flex-col gap-sp-32 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-sp-24">
        <PolizaEncabezado numero={poliza.numero} estado={poliza.estado} />
        <PolizaAcciones />
        <CicloDeVida {...ciclo} />
        {poliza.estado === ESTADO_SUSPENDIDA ? <AvisoSuspension /> : null}
        <PolizaDatos poliza={poliza} cliente={cliente.data} anio={vehiculo.data?.anio} />
        <CuotasTabla cuotas={poliza.cuotas} vigenciaMeses={poliza.vigenciaMeses} />
      </div>
      {/* Columna derecha (B-18): deuda vencida y pagos. */}
      <aside aria-label={ETIQUETA_COLUMNA_DERECHA} className="w-full lg:w-[300px] lg:shrink-0">
        <PolizaRail polizaId={poliza.id} cuotas={poliza.cuotas} />
      </aside>
    </div>
  );
}

/** `/polizas/:id`: encabezado, ciclo de vida, datos y cuotas (B10). Acciones y rail son de B-16 y B-18. */
export function PolizaDetallePage() {
  const { id = '' } = useParams();
  const consulta = usePolizaDetalle(id);
  const status = isApiError(consulta.error) ? consulta.error.status : undefined;
  const noExiste = !esIdValido(id) || status === 404;
  const detalle = isApiError(consulta.error) ? consulta.error.detail : undefined;

  return (
    <section aria-label="Detalle de póliza" className="flex min-w-0 flex-col gap-sp-24">
      <div>{enlaceVolver}</div>
      {noExiste ? <Mensaje texto={detalle ?? mensajeNoExiste(id)} /> : null}
      {!noExiste && status === 403 ? <Mensaje texto={TEXTO_SIN_PERMISO} /> : null}
      {!noExiste && consulta.isPending ? <Esqueleto /> : null}
      {!noExiste && consulta.isError && status !== 403 ? (
        <div className="flex flex-col items-start gap-sp-12">
          <AlertaError>{detalle ?? TEXTO_ERROR_DETALLE}</AlertaError>
          <Button label="Reintentar" variant="secondary" onClick={() => void consulta.refetch()} />
        </div>
      ) : null}
      {consulta.data ? <DetalleCargado poliza={consulta.data} /> : null}
    </section>
  );
}
