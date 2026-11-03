import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import { forwardRef, type ReactElement, type Ref, type SelectHTMLAttributes } from 'react';

import { FieldFrame, fieldClasses, resolveFieldState, type FieldState } from '../Field/FieldFrame';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string = string> extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'children' | 'value' | 'onChange'
> {
  label: string;
  options: readonly SelectOption<T>[];
  value?: T | '' | undefined;
  placeholder?: string;
  helper?: string;
  state?: FieldState;
  error?: boolean;
  onChange?: (value: T) => void;
}

const PLACEHOLDER_POR_DEFECTO = 'Seleccioná una opción';

function SelectInner<T extends string>(
  {
    label,
    options,
    value,
    placeholder,
    helper,
    state,
    error,
    id,
    className,
    disabled,
    onChange,
    ...rest
  }: SelectProps<T>,
  ref: Ref<HTMLSelectElement>,
) {
  const estado = resolveFieldState(disabled, error, state);
  const clases = `${fieldClasses(estado)} appearance-none pr-sp-40`;

  return (
    <FieldFrame id={id} label={label} helper={helper} state={estado}>
      {({ inputId, helperId }) => (
        <div className="relative">
          <select
            {...rest}
            ref={ref}
            id={inputId}
            disabled={disabled}
            value={value ?? ''}
            aria-invalid={estado === 'error' ? true : undefined}
            aria-describedby={helperId}
            // `T` es un literal que la pantalla garantiza en `options`: única conversión.
            onChange={(e) => onChange?.(e.target.value as T)}
            className={className ? `${clases} ${className}` : clases}
          >
            <option value="" disabled hidden>
              {placeholder ?? PLACEHOLDER_POR_DEFECTO}
            </option>
            {options.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-sp-12 top-1/2 -translate-y-1/2"
          >
            <CaretDownIcon size={16} weight="regular" />
          </span>
        </div>
      )}
    </FieldFrame>
  );
}

/** `<select>` nativo con el caret del diseño; ver `design-system §5.3`. */
export const Select = forwardRef(SelectInner) as <T extends string = string>(
  props: SelectProps<T> & { ref?: Ref<HTMLSelectElement> },
) => ReactElement;
