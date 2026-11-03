import { forwardRef, type InputHTMLAttributes } from 'react';

import { FieldFrame, fieldClasses, resolveFieldState, type FieldState } from '../Field/FieldFrame';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label: string;
  helper?: string;
  state?: FieldState;
  error?: boolean;
}

/**
 * Campo de texto con label visible y helper asociado (`aria-describedby`).
 * El foco se resuelve con clases CSS; `ref`, `name`, `onChange` y `onBlur` llegan al `<input>`.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helper, state, error, id, className, disabled, ...rest },
  ref,
) {
  const estado = resolveFieldState(disabled, error, state);

  return (
    <FieldFrame id={id} label={label} helper={helper} state={estado}>
      {({ inputId, helperId }) => (
        <input
          {...rest}
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={estado === 'error' ? true : undefined}
          aria-describedby={helperId}
          className={className ? `${fieldClasses(estado)} ${className}` : fieldClasses(estado)}
        />
      )}
    </FieldFrame>
  );
});
