import { formatearFechaCalendario, type ConsultaPublicaResponse } from '@nexa/api';
import { CardWidget, Dato } from '@nexa/ui';

import { mesesDeVigencia, textoMeses } from '../schemas/vigencia';

interface DatosPolizaProps {
  consulta: ConsultaPublicaResponse;
}

/** Datos de la póliza. No hay titular ni DNI: el back no los devuelve (PB-07, D-10). */
export function DatosPoliza({ consulta }: DatosPolizaProps) {
  const { vehiculo, plan, vigenteDesde, vigenteHasta } = consulta;

  return (
    <CardWidget title="Datos de la póliza">
      <div className="grid grid-cols-1 gap-sp-16 sm:grid-cols-3">
        <Dato
          label="Vehículo"
          value={
            <>
              <span className="block">{`${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}`}</span>
              <span className="block text-text-secondary">{`Patente ${vehiculo.patente}`}</span>
            </>
          }
        />
        <Dato label="Plan" value={`${plan.nombre} (${plan.codigo})`} />
        <Dato
          label="Vigencia"
          value={
            <>
              <span className="block">{textoMeses(mesesDeVigencia(vigenteDesde, vigenteHasta))}</span>
              <span className="block text-text-secondary">
                {`${formatearFechaCalendario(vigenteDesde)} a ${formatearFechaCalendario(vigenteHasta)}`}
              </span>
            </>
          }
        />
      </div>
    </CardWidget>
  );
}
