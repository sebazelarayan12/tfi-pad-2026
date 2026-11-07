import { formatearImporte, type OpcionCotizacion } from '@nexa/api';
import { useId } from 'react';

interface Props {
  opcion: OpcionCotizacion;
  descripcion?: string | undefined;
  elegida: boolean;
  onElegir: (id: string) => void;
}

export function PlanOpcionCard({ opcion, descripcion, elegida, onElegir }: Props) {
  const id = useId();
  const importe = formatearImporte(opcion.primaMensual);
  const nombre = opcion.codigoPlan + ' ' + opcion.plan + ', prima mensual ' + importe;
  return (
    <label
      htmlFor={id}
      className={
        'grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-sp-16 p-sp-24 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-action-primary sm:grid-cols-[auto_minmax(0,1fr)_auto] ' +
        (elegida ? 'bg-accent-lime-soft' : 'bg-surface-panel hover:bg-surface-subtle')
      }
    >
      <input
        id={id}
        className="mt-sp-4 h-5 w-5 accent-action-primary"
        type="radio"
        name="plan"
        value={opcion.idCotizacion}
        checked={elegida}
        aria-checked={elegida}
        aria-label={nombre}
        aria-describedby={descripcion ? id + '-descripcion' : undefined}
        onChange={() => onElegir(opcion.idCotizacion)}
      />
      <span className="flex min-w-0 flex-col gap-sp-8">
        <span className="flex flex-wrap items-baseline gap-x-sp-8">
          <span className="font-mono text-body-sm text-text-secondary">{opcion.codigoPlan}</span>
          <span className="break-words text-h3 text-text-primary">{opcion.plan}</span>
        </span>
        {descripcion ? (
          <span id={id + '-descripcion'} className="break-words text-body-sm text-text-secondary">
            {descripcion}
          </span>
        ) : null}
      </span>
      <span className="col-start-2 flex flex-col gap-sp-4 sm:col-auto sm:items-end">
        <span className="text-caption text-text-secondary">Prima mensual</span>
        <span className="font-mono text-mono-lg text-text-primary">{importe}</span>
      </span>
    </label>
  );
}
