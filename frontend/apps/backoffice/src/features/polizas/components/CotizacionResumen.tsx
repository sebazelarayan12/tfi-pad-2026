import { formatearFechaHora, formatearImporte, type CotizacionDto } from '@nexa/api';
import { AlertaError } from '@nexa/ui';
import type { ReactNode } from 'react';
import type { useCotizacionEmision } from '../api/useCotizacionEmision';
import { detalleEmision } from '../api/detalleEmision';

type Asociados = Omit<ReturnType<typeof useCotizacionEmision>, 'cotizacion'>;

function DatoResumen({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-label text-text-secondary">{etiqueta}</dt>
      <dd className="mt-sp-4 break-words text-body-sm text-text-primary">{children}</dd>
    </div>
  );
}

export function CotizacionResumen({
  datos,
  cliente,
  vehiculo,
  plan,
}: Asociados & { datos: CotizacionDto }) {
  const titular = cliente.isError ? undefined : cliente.data;
  const auto = vehiculo.data;
  const cobertura = plan.data;
  const [validez] = formatearFechaHora(datos.fechaVencimiento).split(' ');
  return (
    <section className="flex flex-col gap-sp-16 rounded-card border border-border-hairline bg-surface-panel p-sp-20">
      <h2 className="text-h3 text-text-primary">Cotización</h2>
      <dl className="grid grid-cols-2 gap-sp-16 lg:grid-cols-4">
        <DatoResumen etiqueta="Cliente">
          {titular ? titular.nombre + ' ' + titular.apellido : 'No disponible'}
        </DatoResumen>
        <DatoResumen etiqueta="Vehículo">
          {auto ? (
            <>
              {auto.marca} {auto.modelo} {auto.anio}
              <span className="block font-mono">{auto.patente}</span>
            </>
          ) : (
            'No disponible'
          )}
        </DatoResumen>
        <DatoResumen etiqueta="Plan">
          {cobertura ? datos.codigoPlan + ' ' + cobertura.nombre : 'No disponible'}
        </DatoResumen>
        <DatoResumen etiqueta="Prima mensual">
          <strong className="font-mono text-h3">{formatearImporte(datos.primaMensual)}</strong>
        </DatoResumen>
      </dl>
      <p className="text-body-sm text-text-secondary">Válida hasta {validez}</p>
      {vehiculo.isError ? (
        <AlertaError>
          {detalleEmision(vehiculo.error, 'No se pudo cargar el vehículo.')}
        </AlertaError>
      ) : null}
      {plan.isError ? (
        <AlertaError>{detalleEmision(plan.error, 'No se pudo cargar el plan.')}</AlertaError>
      ) : null}
    </section>
  );
}
