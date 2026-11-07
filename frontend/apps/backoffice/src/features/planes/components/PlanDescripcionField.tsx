import { useId } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

export function PlanDescripcionField({
  campo,
  error,
}: {
  campo: UseFormRegisterReturn<'descripcion'>;
  error?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-sp-8">
      <label htmlFor={id} className="text-label text-text-primary">
        Descripción
      </label>
      <textarea
        {...campo}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="min-h-20 rounded-input border border-border-strong bg-surface-panel px-sp-12 py-sp-8 text-body text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-action-primary"
      />
      {error ? (
        <p id={errorId} className="text-label text-status-cancelada-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
