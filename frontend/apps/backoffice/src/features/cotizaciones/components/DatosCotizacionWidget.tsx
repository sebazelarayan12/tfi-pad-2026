import {
  obtenerEnum,
  type ClienteResponse,
  type OpcionCotizacion,
  type VehiculoResponse,
} from '@nexa/api';
import { CardWidget } from '@nexa/ui';
import type { ReactNode } from 'react';
import { leerCalculo } from '../types/calculo';
import { formatoFactor } from './formatoCalculo';

const NO_DISPONIBLE = 'No disponible';

interface Props {
  cliente: ClienteResponse | undefined;
  vehiculo: VehiculoResponse | undefined;
  opciones: OpcionCotizacion[] | undefined;
  elegida: OpcionCotizacion | undefined;
}

function Fila({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-sp-12">
      <dt className="text-text-secondary">{etiqueta}</dt>
      <dd className="break-words text-right text-text-primary">{children}</dd>
    </div>
  );
}

function conFactor(etiqueta: string | undefined, factor: number | undefined): string {
  if (etiqueta === undefined) return NO_DISPONIBLE;
  return factor === undefined ? etiqueta : etiqueta + ' (' + formatoFactor(factor) + ')';
}

export function DatosCotizacionWidget({ cliente, vehiculo, opciones, elegida }: Props) {
  const calculo = elegida
    ? leerCalculo(elegida)
    : opciones?.map(leerCalculo).find((opcion) => opcion !== undefined);
  const nombre = cliente ? [cliente.nombre, cliente.apellido].filter(Boolean).join(' ') : '';
  return (
    <CardWidget title="Datos de la cotización">
      <dl className="flex flex-col gap-sp-12">
        <Fila etiqueta="Cliente">{nombre || NO_DISPONIBLE}</Fila>
        <Fila etiqueta="Vehículo">
          {vehiculo ? (
            <>
              {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}
              <span className="block font-mono text-text-secondary">{vehiculo.patente}</span>
            </>
          ) : (
            NO_DISPONIBLE
          )}
        </Fila>
        {opciones?.length ? (
          <>
            <Fila etiqueta="Tipo">
              {conFactor(
                obtenerEnum('TipoVehiculo', vehiculo?.tipo)?.etiqueta,
                calculo?.factorTipo,
              )}
            </Fila>
            {calculo ? (
              <>
                <Fila etiqueta="Antigüedad">({formatoFactor(calculo.factorAntiguedad)})</Fila>
                <Fila etiqueta="Conductor">({formatoFactor(calculo.factorEdad)})</Fila>
              </>
            ) : null}
            <Fila etiqueta="Uso">
              {conFactor(obtenerEnum('UsoVehiculo', vehiculo?.uso)?.etiqueta, calculo?.factorUso)}
            </Fila>
          </>
        ) : null}
      </dl>
    </CardWidget>
  );
}
