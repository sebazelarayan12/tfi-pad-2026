import type { OpcionCotizacion, PlanResponse } from '@nexa/api';
import { useId } from 'react';
import { ordenarOpciones } from './ordenarOpciones';
import { PlanOpcionCard } from './PlanOpcionCard';

interface Props {
  opciones: OpcionCotizacion[];
  catalogo: PlanResponse[];
  seleccion: string | null;
  onElegir: (id: string) => void;
}

export function PlanesCompatibles({ opciones, catalogo, seleccion, onElegir }: Props) {
  const idTitulo = useId();
  const descripciones = new Map(catalogo.map(({ codigo, descripcion }) => [codigo, descripcion]));
  return (
    <section className="flex flex-col gap-sp-16" aria-labelledby={idTitulo}>
      <div className="flex flex-col gap-sp-4">
        <h2 id={idTitulo} className="text-h2 text-text-primary">
          Planes compatibles
        </h2>
        <p className="text-body-sm text-text-secondary">
          Prima mensual = prima base x factores (RN06). La cotización vale 15 días.
        </p>
      </div>
      {opciones.length ? (
        <div
          role="radiogroup"
          aria-labelledby={idTitulo}
          className="divide-y divide-border-hairline overflow-hidden rounded-card border border-border-hairline"
        >
          {ordenarOpciones(opciones).map((opcion) => (
            <PlanOpcionCard
              key={opcion.idCotizacion}
              opcion={opcion}
              descripcion={descripciones.get(opcion.codigoPlan)?.trim()}
              elegida={seleccion === opcion.idCotizacion}
              onElegir={onElegir}
            />
          ))}
        </div>
      ) : (
        <p role="status" className="text-body-sm text-text-secondary">
          Ningún plan es compatible con el vehículo.
        </p>
      )}
    </section>
  );
}
