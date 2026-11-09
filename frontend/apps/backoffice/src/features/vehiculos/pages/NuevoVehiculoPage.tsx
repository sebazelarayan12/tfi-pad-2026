import { ApiError } from '@nexa/api';
import { AlertaError, Button, CardWidget, toast } from '@nexa/ui';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { useRol } from '../../auth';
import { mensajeErrorVehiculo } from '../api/errorAlta';
import { useAltaVehiculo } from '../api/useAltaVehiculo';
import { useClienteContexto } from '../api/useClienteContexto';
import { ClienteContexto, ClienteNoEncontrado } from '../components/ClienteContexto';
import { VehiculoAltaForm } from '../components/VehiculoAltaForm';

const clienteIdSchema = z.guid();

function esNoEncontrado(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

function AltaConCliente({ clienteId }: { clienteId: string }) {
  const cliente = useClienteContexto(clienteId);
  const alta = useAltaVehiculo(clienteId);
  const navegar = useNavigate();
  const ficha = '/clientes/' + encodeURIComponent(clienteId);

  if (
    esNoEncontrado(cliente.error) ||
    esNoEncontrado(alta.error) ||
    cliente.data?.activo === false
  ) {
    return <ClienteNoEncontrado />;
  }

  if (cliente.isError) {
    return (
      <div className="flex flex-col items-start gap-sp-12">
        <AlertaError>{mensajeErrorVehiculo(cliente.error)}</AlertaError>
        <Button
          label="Reintentar"
          variant="secondary"
          disabled={cliente.isFetching}
          aria-busy={cliente.isFetching}
          onClick={() => void cliente.refetch()}
        />
      </div>
    );
  }

  return (
    <>
      {cliente.data ? (
        <Link
          to={ficha}
          className="inline-flex w-fit items-center gap-sp-8 rounded-input text-label text-text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          <ArrowLeftIcon size={16} aria-hidden="true" />
          {cliente.data.nombre} {cliente.data.apellido}
        </Link>
      ) : null}
      <ClienteContexto cliente={cliente.data} />
      <div className="flex min-w-0 flex-col gap-sp-24 xl:flex-row">
        <div className="min-w-0 flex-1">
          <VehiculoAltaForm
            habilitado={cliente.isSuccess}
            guardando={alta.isPending}
            onCancelar={() => navegar(ficha)}
            onGuardar={(valores) =>
              alta.mutateAsync(valores, {
                onSuccess: (vehiculo) => {
                  const texto = 'Vehículo ' + vehiculo.patente + ' agregado.';
                  toast.success(texto);
                  navegar(ficha, { replace: true, state: { aviso: { tipo: 'exito', texto } } });
                },
              })
            }
          />
        </div>
        <aside
          aria-label="Reglas del alta"
          className="w-full xl:w-[300px] xl:shrink-0 xl:border-l xl:border-border-hairline xl:pl-sp-24"
        >
          <h2 className="sr-only">Información del alta</h2>
          <CardWidget title="Reglas">
            <ul className="flex flex-col gap-sp-8">
              <li>La patente es única.</li>
              <li>El titular informado por DNRPA debe ser el cliente.</li>
              <li>Un vehículo tiene una sola póliza activa.</li>
            </ul>
          </CardWidget>
        </aside>
      </div>
    </>
  );
}

export function NuevoVehiculoPage() {
  const rol = useRol();
  const { clienteId } = useParams();
  if (rol !== 'Empleado' && rol !== 'Administrador') {
    return <p className="text-text-primary">No tenés permiso para esta acción.</p>;
  }
  const id = clienteIdSchema.safeParse(clienteId);
  return (
    <section className="flex min-w-0 flex-col gap-sp-16" aria-label="Nuevo vehículo">
      {id.success ? <AltaConCliente key={id.data} clienteId={id.data} /> : <ClienteNoEncontrado />}
    </section>
  );
}
