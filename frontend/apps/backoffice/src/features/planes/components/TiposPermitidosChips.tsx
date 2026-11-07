import { Chip } from '@nexa/ui';
import { useId } from 'react';
import { TIPOS_VEHICULO } from '../schemas/planSchema';
import type { TipoVehiculoPlan } from '../types/planes';

export function TiposPermitidosChips({
  value,
  onChange,
  error,
}: {
  value: TipoVehiculoPlan[];
  onChange: (tipos: TipoVehiculoPlan[]) => void;
  error?: string;
}) {
  const errorId = useId();
  return (
    <fieldset aria-describedby={error ? errorId : undefined} className="flex flex-col gap-sp-8">
      <legend className="mb-sp-8 text-label text-text-primary">Tipos permitidos</legend>
      <div className="flex flex-wrap gap-sp-8">
        {TIPOS_VEHICULO.map((tipo) => {
          const seleccionado = value.includes(tipo);
          return (
            <Chip
              key={tipo}
              tipo={seleccionado ? 'seleccionado' : 'sin-seleccionar'}
              label={tipo}
              onClick={() =>
                onChange(seleccionado ? value.filter((valor) => valor !== tipo) : [...value, tipo])
              }
            />
          );
        })}
      </div>
      {error ? (
        <p id={errorId} className="text-label text-status-cancelada-text">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
