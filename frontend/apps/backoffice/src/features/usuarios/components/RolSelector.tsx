import { forwardRef, useId, type InputHTMLAttributes } from 'react';

import { ROLES_ASIGNABLES } from '../schemas/crearUsuarioSchema';

interface RolSelectorProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value'> {
  mensajeError?: string;
}

const CHIP =
  'inline-flex h-7 cursor-pointer items-center rounded-pill px-sp-12 py-sp-4 text-label border border-border-strong bg-surface-panel text-text-primary peer-checked:border-transparent peer-checked:bg-action-primary peer-checked:text-action-on-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50';

/**
 * Grupo de radios con aspecto de `Chip` (B14 §12). Ninguno viene marcado (D-20). Los radios comparten
 * `name`; la misma ref va a los dos radios porque react-hook-form lee el valor del grupo por ellas.
 */
export const RolSelector = forwardRef<HTMLInputElement, RolSelectorProps>(function RolSelector(
  { mensajeError, name, onChange, onBlur, disabled },
  ref,
) {
  const idEtiqueta = useId();
  const idError = useId();

  return (
    <div className="flex flex-col gap-sp-8">
      <div
        role="radiogroup"
        aria-labelledby={idEtiqueta}
        aria-describedby={mensajeError ? idError : undefined}
        aria-invalid={mensajeError ? true : undefined}
        className="flex flex-col gap-sp-8"
      >
        <span id={idEtiqueta} className="text-label text-text-primary">
          Rol
        </span>
        <div className="flex gap-sp-8">
          {ROLES_ASIGNABLES.map((rol) => (
            <label key={rol} className="relative">
              <input
                type="radio"
                value={rol}
                name={name}
                disabled={disabled}
                onChange={onChange}
                onBlur={onBlur}
                ref={ref}
                className="peer absolute inset-0 size-full opacity-0"
              />
              <span className={CHIP}>{rol}</span>
            </label>
          ))}
        </div>
      </div>
      {mensajeError ? (
        <p id={idError} className="text-body-sm text-status-cancelada-text">
          {mensajeError}
        </p>
      ) : null}
    </div>
  );
});
