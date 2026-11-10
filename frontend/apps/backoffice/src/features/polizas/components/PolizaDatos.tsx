import {
  formatearDni,
  formatearFechaCalendario,
  formatearImporte,
  type ClienteResponse,
  type PolizaDetalleResponse,
} from '@nexa/api';
import { CardWidget } from '@nexa/ui';
import type { ReactNode } from 'react';

import { TEXTO_NO_DISPONIBLE_DETALLE, TITULO_DATOS } from '../textosDetalle';

interface PolizaDatosProps {
  poliza: PolizaDetalleResponse;
  cliente: ClienteResponse | undefined;
  anio: number | undefined;
}

function Fila({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-sp-4">
      <dt className="text-caption text-text-secondary">{etiqueta}</dt>
      <dd className="break-words text-text-primary">{children}</dd>
    </div>
  );
}

const sinDato = <span className="text-text-secondary">{TEXTO_NO_DISPONIBLE_DETALLE}</span>;

export function PolizaDatos({ poliza, cliente, anio }: PolizaDatosProps) {
  const nombre = cliente ? [cliente.nombre, cliente.apellido].filter(Boolean).join(' ') : '';
  const vehiculo = [poliza.marca, poliza.modelo, anio].filter(Boolean).join(' ');
  const vigencia =
    `${poliza.vigenciaMeses} meses, ${formatearFechaCalendario(poliza.fechaInicio)}` +
    ` a ${formatearFechaCalendario(poliza.fechaFin)}`;
  return (
    <CardWidget title={TITULO_DATOS}>
      <dl className="grid grid-cols-1 gap-x-sp-32 gap-y-sp-16 text-body-sm sm:grid-cols-2">
        <Fila etiqueta="Cliente">{nombre || sinDato}</Fila>
        <Fila etiqueta="DNI">
          {cliente ? <span className="font-mono text-mono">{formatearDni(cliente.dni)}</span> : sinDato}
        </Fila>
        <Fila etiqueta="Vehículo">{vehiculo}</Fila>
        <Fila etiqueta="Patente">
          <span className="font-mono text-mono">{poliza.patente}</span>
        </Fila>
        <Fila etiqueta="Plan">{`${poliza.nombrePlan} (${poliza.codigoPlan})`}</Fila>
        <Fila etiqueta="Prima">
          <span className="font-mono text-mono-lg">{formatearImporte(poliza.primaMensual)}</span>
        </Fila>
        <Fila etiqueta="Vigencia">{vigencia}</Fila>
        <Fila etiqueta="Emitida por">{sinDato}</Fila>
      </dl>
    </CardWidget>
  );
}
