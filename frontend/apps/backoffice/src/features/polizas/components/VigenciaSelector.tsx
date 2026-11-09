import { useId } from 'react';
import { vigencias, type VigenciaMeses } from '../schemas/emisionSchema';

export function VigenciaSelector({
  valor,
  onElegir,
  disabled,
}: {
  valor: VigenciaMeses | null;
  onElegir: (valor: VigenciaMeses) => void;
  disabled: boolean;
}) {
  const id = useId();
  return (
    <fieldset disabled={disabled} className="flex flex-col gap-sp-12">
      <legend id={id} className="mb-sp-8 text-h3 text-text-primary">
        Vigencia
      </legend>
      <div role="radiogroup" aria-labelledby={id} className="flex flex-wrap gap-sp-8">
        {vigencias.map((meses) => (
          <label key={meses} className="relative">
            <input
              type="radio"
              name={id}
              value={meses}
              checked={valor === meses}
              onChange={() => onElegir(meses)}
              className="peer sr-only"
            />
            <span className="inline-flex h-7 cursor-pointer items-center rounded-pill border border-border-strong bg-surface-panel px-sp-12 text-label text-text-primary peer-checked:border-transparent peer-checked:bg-accent-lime peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
              {meses === 1 ? '1 mes' : meses + ' meses'}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
