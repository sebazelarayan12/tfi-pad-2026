import { formatearDni, type ClienteResponse } from '@nexa/api';
import { EstadoBadge } from '@nexa/ui';
import type { ReactNode } from 'react';
import { ReintentarRenaperBoton } from './ReintentarRenaperBoton';

/** Iniciales de nombre y apellido (B5 §9): se derivan en el front, no vienen del back. */
function iniciales(nombre: string, apellido: string): string {
  const letra = (texto: string) => texto.trim().charAt(0).toUpperCase();
  return `${letra(nombre)}${letra(apellido)}`;
}

interface ClienteEncabezadoProps {
  cliente: ClienteResponse;
  /** Botones de B-08 (editar, dar de baja); sin ellos no se muestra nada. */
  acciones?: ReactNode;
}

export function ClienteEncabezado({ cliente, acciones }: ClienteEncabezadoProps) {
  return (
    <header className="flex flex-wrap items-center gap-sp-16">
      <div
        aria-hidden="true"
        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-h3 text-text-primary"
      >
        {iniciales(cliente.nombre, cliente.apellido)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-sp-4">
        <h1 className="break-words text-h2 text-text-primary">
          {cliente.nombre} {cliente.apellido}
        </h1>
        <div className="flex flex-wrap items-center gap-x-sp-16 gap-y-sp-4 text-body-sm text-text-secondary">
          <p>
            DNI{' '}
            <span className="font-mono text-mono text-text-primary">
              {formatearDni(cliente.dni)}
            </span>
          </p>
          <p>
            CUIL <span className="font-mono text-mono text-text-primary">{cliente.cuil}</span>
          </p>
          <p className="flex items-center gap-sp-8">
            Renaper
            <EstadoBadge estado={cliente.validadoRenaper ? 'Validado' : 'Pendiente'} />
          </p>
          {cliente.validadoRenaper === false ? (
            <ReintentarRenaperBoton clienteId={cliente.id} />
          ) : null}
        </div>
      </div>
      {acciones ? <div className="flex flex-wrap gap-sp-12">{acciones}</div> : null}
    </header>
  );
}
