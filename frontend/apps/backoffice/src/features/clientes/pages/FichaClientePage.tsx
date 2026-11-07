import { isApiError, type ClienteResponse } from '@nexa/api';
import { AlertaError, Button, ButtonLink } from '@nexa/ui';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { Link, useParams } from 'react-router-dom';

import { useCliente } from '../api/useCliente';
import { usePolizasDelCliente } from '../api/usePolizasDelCliente';
import { useProximasCuotas } from '../api/useProximasCuotas';
import { useVehiculosDelCliente } from '../api/useVehiculosDelCliente';
import { AccionesRapidas } from '../components/AccionesRapidas';
import { ClienteEncabezado } from '../components/ClienteEncabezado';
import { ClienteTabs } from '../components/ClienteTabs';
import { DatosClienteLectura } from '../components/DatosClienteLectura';
import { SeccionPolizas } from '../components/SeccionPolizas';
import { SeccionVehiculos } from '../components/SeccionVehiculos';
import type { EstadoPolizasFila } from '../components/VehiculoFila';

const enlaceListado = (
  <ButtonLink
    label="Clientes"
    href="/clientes"
    variant="ghost"
    size="s"
    icon={<ArrowLeftIcon size={16} />}
    renderLink={({ href, ...props }) => <Link to={href} {...props} />}
  />
);

function ClienteNoEncontrado() {
  return (
    <div className="flex flex-col items-start gap-sp-16 rounded-card border border-border-hairline bg-surface-panel p-sp-24">
      <p className="text-body-sm text-text-secondary">Cliente no encontrado.</p>
      <ButtonLink
        label="Volver a clientes"
        href="/clientes"
        variant="secondary"
        renderLink={({ href, ...props }) => <Link to={href} replace {...props} />}
      />
    </div>
  );
}

function EsqueletoFicha() {
  return (
    <div aria-hidden="true" className="flex items-center gap-sp-16">
      <span className="size-14 rounded-full bg-surface-subtle motion-safe:animate-pulse" />
      <div className="flex flex-1 flex-col gap-sp-8">
        <span className="h-5 w-64 max-w-full rounded-input bg-surface-subtle motion-safe:animate-pulse" />
        <span className="h-3 w-48 max-w-full rounded-input bg-surface-subtle motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

export interface FichaClientePageProps {
  /** Los provee B-08; sin ellos los botones no se muestran. */
  onEditar?: () => void;
  onDarDeBaja?: () => void;
}

function FichaCargada({
  cliente,
  onEditar,
  onDarDeBaja,
}: FichaClientePageProps & { cliente: ClienteResponse }) {
  const vehiculos = useVehiculosDelCliente(cliente.id, true);
  const polizas = usePolizasDelCliente(cliente.id, true);
  const proximos = useProximasCuotas(polizas.data?.items ?? []);

  const estadoPolizas: EstadoPolizasFila = polizas.isError
    ? 'error'
    : polizas.isSuccess
      ? 'listo'
      : 'cargando';

  const acciones =
    onEditar || onDarDeBaja ? (
      <>
        {onEditar ? <Button label="Editar" variant="secondary" onClick={onEditar} /> : null}
        {onDarDeBaja ? (
          <Button label="Dar de baja" variant="secondary" onClick={onDarDeBaja} />
        ) : null}
      </>
    ) : undefined;

  return (
    <div className="flex flex-col gap-sp-32 xl:flex-row xl:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-sp-24">
        <ClienteEncabezado cliente={cliente} acciones={acciones} />
        <ClienteTabs
          vehiculos={
            <>
              <SeccionVehiculos
                clienteId={cliente.id}
                vehiculos={vehiculos.data}
                cargando={vehiculos.isPending}
                hayError={vehiculos.isError}
                onReintentar={() => void vehiculos.refetch()}
                polizas={polizas.data?.items ?? []}
                estadoPolizas={estadoPolizas}
              />
              <SeccionPolizas
                pagina={polizas.data}
                cargando={polizas.isPending}
                hayError={polizas.isError}
                onReintentar={() => void polizas.refetch()}
                vehiculos={vehiculos.data ?? []}
                proximos={proximos}
              />
            </>
          }
          datos={<DatosClienteLectura cliente={cliente} />}
        />
      </div>
      <aside aria-label="Acciones del cliente" className="w-full xl:w-[280px] xl:shrink-0">
        <AccionesRapidas clienteId={cliente.id} />
      </aside>
    </div>
  );
}

/** `/clientes/:clienteId`: ficha con encabezado, pestañas, vehículos, pólizas y rail (B5). */
export function FichaClientePage({ onEditar, onDarDeBaja }: FichaClientePageProps) {
  const { clienteId = '' } = useParams();
  const cliente = useCliente(clienteId);
  const datos = cliente.data;
  // El back responde 404 a un cliente dado de baja; si llegara inactivo no se muestra.
  const noEncontrado =
    (cliente.isError && isApiError(cliente.error) && cliente.error.status === 404) ||
    datos?.activo === false;

  return (
    <section aria-label="Ficha de cliente" className="flex min-w-0 flex-col gap-sp-24">
      <div>{enlaceListado}</div>
      {noEncontrado ? <ClienteNoEncontrado /> : null}
      {cliente.isPending ? <EsqueletoFicha /> : null}
      {cliente.isError && !noEncontrado ? (
        <div className="flex flex-col items-start gap-sp-12">
          <AlertaError>No pudimos cargar el cliente.</AlertaError>
          <Button label="Reintentar" variant="secondary" onClick={() => void cliente.refetch()} />
        </div>
      ) : null}
      {datos?.activo ? (
        <FichaCargada cliente={datos} onEditar={onEditar} onDarDeBaja={onDarDeBaja} />
      ) : null}
    </section>
  );
}
