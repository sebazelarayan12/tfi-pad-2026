import { Button, Input, toast } from '@nexa/ui';
import { forwardRef, useState } from 'react';

import { generarPasswordTemporal } from '../schemas/generarPassword';

interface PasswordFieldProps {
  name: string;
  value: string;
  onChange: (valor: string) => void;
  onBlur: () => void;
  mensajeError?: string;
  disabled?: boolean;
}

const HELPER = 'Compartila por un canal seguro.';
const MENSAJE_COPIADA = 'Contraseña copiada.';
const MENSAJE_COPIA_FALLO = 'No se pudo copiar. Copiala a mano.';

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
 * Campo de la contraseña temporal (B14 §5): `Generar` la crea con `crypto.getRandomValues` y la deja
 * visible; `Copiar` la pasa al portapapeles (D-B24-05). El valor vive en el formulario, en memoria.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { name, value, onChange, onBlur, mensajeError, disabled },
  ref,
) {
  const [visible, setVisible] = useState(false);

  function generar() {
    onChange(generarPasswordTemporal());
    setVisible(true);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(MENSAJE_COPIADA);
    } catch {
      toast.error(MENSAJE_COPIA_FALLO);
    }
  }

  return (
    <div className="flex flex-col gap-sp-8">
      <div className="relative">
        <Input
          ref={ref}
          name={name}
          label="Contraseña temporal"
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          value={value}
          disabled={disabled}
          error={mensajeError !== undefined}
          helper={mensajeError ?? HELPER}
          className="pr-sp-40"
          onChange={(evento) => onChange(evento.target.value)}
          onBlur={onBlur}
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
      <div className="flex items-center gap-sp-8">
        <Button
          label="Generar"
          variant="secondary"
          size="s"
          aria-label="Generar contraseña temporal"
          disabled={disabled}
          onClick={generar}
        />
        <Button
          label="Copiar"
          variant="secondary"
          size="s"
          aria-label="Copiar contraseña temporal"
          disabled={disabled || value === ''}
          onClick={() => void copiar()}
        />
      </div>
    </div>
  );
});
