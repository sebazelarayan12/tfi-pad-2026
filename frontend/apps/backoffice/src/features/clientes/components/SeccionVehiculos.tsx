import type { PolizaListItemResponse, VehiculoResponse } from '@nexa/api';
import { AlertaError, Button, ButtonLink } from '@nexa/ui';
import { Link } from 'react-router-dom';

import { polizaActivaDeVehiculo } from '../api/reglaPolizaActiva';
import { VehiculoFila, type EstadoPolizasFila } from './VehiculoFila';

interface SeccionVehiculosProps {
  clienteId: string;
  vehiculos: readonly VehiculoResponse[] | undefined;
  cargando: boolean;
  hayError: boolean;
  onReintentar: () => void;
  polizas: readonly PolizaListItemResponse[];
  estadoPolizas: EstadoPolizasFila;
}

const esqueleto = (
  <li
    aria-hidden="true"
    className="h-[72px] rounded-card bg-surface-subtle motion-safe:animate-pulse"
  />
);

export function SeccionVehiculos({
  clienteId,
  vehiculos,
  cargando,
  hayError,
  onReintentar,
  polizas,
  estadoPolizas,
}: SeccionVehiculosProps) {
  return (
    <section
      aria-label="Vehículos del cliente"
      aria-busy={cargando}
      className="flex flex-col gap-sp-16 pt-sp-24"
    >
      <h2 className="text-h3 text-text-primary">Vehículos</h2>
      {hayError ? (
        <div className="flex flex-col items-start gap-sp-12">
          <AlertaError>No pudimos cargar los vehículos.</AlertaError>
          <Button label="Reintentar" variant="secondary" onClick={onReintentar} />
        </div>
      ) : null}
      {cargando ? (
        <ul className="flex flex-col gap-sp-12">
          {esqueleto}
          {esqueleto}
        </ul>
      ) : null}
      {vehiculos && vehiculos.length > 0 ? (
        <ul className="flex flex-col gap-sp-12">
          {vehiculos.map((vehiculo) => (
            <VehiculoFila
              key={vehiculo.id}
              vehiculo={vehiculo}
              poliza={polizaActivaDeVehiculo(vehiculo, polizas)}
              estadoPolizas={estadoPolizas}
            />
          ))}
        </ul>
      ) : null}
      {vehiculos && vehiculos.length === 0 ? (
        <div className="flex flex-col items-start gap-sp-12 text-body-sm text-text-secondary">
          <p>Este cliente no tiene vehículos.</p>
          <ButtonLink
            label="Agregar vehículo"
            href={`/clientes/${encodeURIComponent(clienteId)}/vehiculos/nuevo`}
            renderLink={({ href, ...props }) => <Link to={href} {...props} />}
          />
        </div>
      ) : null}
    </section>
  );
}
