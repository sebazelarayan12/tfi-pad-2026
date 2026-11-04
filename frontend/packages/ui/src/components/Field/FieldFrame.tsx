import { useId, type ReactNode } from 'react';

export type FieldState = 'default' | 'error' | 'disabled';

export interface FieldIds {
  inputId: string;
  helperId: string | undefined;
}

export interface FieldFrameProps {
  id?: string | undefined;
  label: string;
  helper?: string | undefined;
  state: FieldState;
  children: (ids: FieldIds) => ReactNode;
}

/**
 * Contenedor interno de Input y Select: label, campo y helper.
 * No se exporta desde el barrel: no es un primitivo público.
 */
export function FieldFrame({ id, label, helper, state, children }: FieldFrameProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = helper ? `${inputId}-helper` : undefined;

  return (
    <div className="flex flex-col gap-sp-8" data-state={state}>
      <label
        htmlFor={inputId}
        className={`text-label text-text-secondary${state === 'disabled' ? ' opacity-60' : ''}`}
      >
        {label}
      </label>
      {children({ inputId, helperId })}
      {helper ? (
        <p
          id={helperId}
          className={`text-label ${state === 'error' ? 'text-status-cancelada-text' : 'text-text-tertiary'}`}
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
}

/** Estado visual derivado de las props: disabled gana sobre error. */
export function resolveFieldState(
  disabled: boolean | undefined,
  error: boolean | undefined,
  state: FieldState | undefined,
): FieldState {
  if (disabled) return 'disabled';
  if (error || state === 'error') return 'error';
  return state ?? 'default';
}

const CAMPO_BASE =
  'box-border h-10 w-full rounded-input border bg-surface-panel px-sp-12 text-body text-text-primary placeholder:text-text-tertiary focus:border-action-primary focus:outline-none focus:ring-1 focus:ring-inset focus:ring-action-primary';

const CAMPO_POR_ESTADO: Record<FieldState, string> = {
  default: 'border-border-strong',
  error: 'border-status-cancelada-text',
  disabled: 'border-border-hairline bg-surface-subtle text-text-tertiary',
};

/** Clases del campo nativo (`<input>` o `<select>`) según su estado. */
export function fieldClasses(state: FieldState): string {
  return `${CAMPO_BASE} ${CAMPO_POR_ESTADO[state]}`;
}
