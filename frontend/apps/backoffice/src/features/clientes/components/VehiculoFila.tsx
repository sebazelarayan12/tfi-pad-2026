import {
  etiquetaEnum,
  obtenerEnum,
  type PolizaListItemResponse,
  type VehiculoResponse,
} from '@nexa/api';
import { ButtonLink, EstadoBadge } from '@nexa/ui';
import { CarIcon } from '@phosphor-icons/react/dist/csr/Car';
import { MotorcycleIcon } from '@phosphor-icons/react/dist/csr/Motorcycle';
import { Link } from 'react-router-dom';

import { BadgeEstadoPoliza } from './BadgeEstadoPoliza';

export type EstadoPolizasFila = 'cargando' | 'error' | 'listo';

interface VehiculoFilaProps {
  vehiculo: VehiculoResponse;
  /** Póliza activa del vehículo (RN04), o `undefined` si no tiene. */
  poliza: PolizaListItemResponse | undefined;
  /** Mientras las pólizas no llegan no se afirma "Sin póliza activa". */
  estadoPolizas: EstadoPolizasFila;
}

function ZonaPoliza({ vehiculo, poliza, estadoPolizas }: VehiculoFilaProps) {
  if (estadoPolizas === 'cargando') {
    return (
      <span
        aria-hidden="true"
        className="block h-3 w-32 rounded-input bg-surface-subtle motion-safe:animate-pulse"
      />
    );
  }
  if (estadoPolizas === 'error') return null;
  if (poliza) {
    return (
      <div className="flex items-center gap-sp-8 text-body-sm text-text-secondary">
        Póliza
        <span className="font-mono text-mono text-text-primary">{poliza.numero}</span>
        <BadgeEstadoPoliza estado={poliza.estado} />
      </div>
    );
  }
  const destino = `/cotizaciones/nueva?vehiculoId=${encodeURIComponent(vehiculo.id)}&clienteId=${encodeURIComponent(vehiculo.clienteId)}`;
  return (
    <div className="flex items-center gap-sp-12 text-body-sm text-text-secondary">
      Sin póliza activa
      <ButtonLink
        label="Cotizar"
        href={destino}
        variant="secondary"
        size="s"
        renderLink={({ href, ...props }) => <Link to={href} {...props} />}
      />
    </div>
  );
}

export function VehiculoFila({ vehiculo, poliza, estadoPolizas }: VehiculoFilaProps) {
  const esMoto = obtenerEnum('TipoVehiculo', vehiculo.tipo)?.literal === 'Moto';
  const Icono = esMoto ? MotorcycleIcon : CarIcon;

  return (
    <li className="flex flex-wrap items-center justify-between gap-sp-16 border-b border-border-hairline py-sp-16">
      <div className="flex min-w-0 items-center gap-sp-12">
        <span
          aria-hidden="true"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-input bg-surface-subtle text-text-primary"
        >
          <Icono size={20} />
        </span>
        <div className="flex min-w-0 flex-col gap-sp-4">
          <p className="break-words text-h3 text-text-primary">
            {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}
          </p>
          <div className="flex flex-wrap items-center gap-x-sp-12 text-body-sm text-text-secondary">
            <span>
              Patente{' '}
              <span className="font-mono text-mono text-text-primary">{vehiculo.patente}</span>
            </span>
            <span>
              {etiquetaEnum('TipoVehiculo', vehiculo.tipo)} ·{' '}
              {etiquetaEnum('UsoVehiculo', vehiculo.uso)}
            </span>
            {vehiculo.validadoDnrpa ? (
              <span className="flex items-center gap-sp-8">
                <EstadoBadge estado="Validado" />
                DNRPA
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <ZonaPoliza vehiculo={vehiculo} poliza={poliza} estadoPolizas={estadoPolizas} />
    </li>
  );
}
