import { Input, type InputProps } from '@nexa/ui';
import { forwardRef, useState } from 'react';

type CampoContrasenaProps = Omit<InputProps, 'type'>;

function IconoOjo({ tachado }: { tachado: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10Z" />
      <circle cx="10" cy="10" r="2.5" />
      {tachado ? <path d="M3 17 17 3" /> : null}
    </svg>
  );
}

/**
 * `Input` de contraseña con botón para mostrarla u ocultarla (B1 §8, D-B01-6). El primitivo no tiene
 * slot de acción, así que el botón se posiciona sobre el campo (label de 16 px + gap de 8 px).
 */
export const CampoContrasena = forwardRef<HTMLInputElement, CampoContrasenaProps>(
  function CampoContrasena({ className, disabled, ...rest }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <Input
          {...rest}
          ref={ref}
          type={visible ? 'text' : 'password'}
          disabled={disabled}
          className={className ? `pr-sp-40 ${className}` : 'pr-sp-40'}
        />
        <button
          type="button"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible((actual) => !actual)}
          className="absolute right-0 top-6 flex size-10 items-center justify-center rounded-input text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconoOjo tachado={visible} />
        </button>
      </div>
    );
  },
);
