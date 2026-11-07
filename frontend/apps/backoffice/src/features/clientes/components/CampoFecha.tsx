import { Button, Input } from '@nexa/ui';
import { CalendarBlankIcon } from '@phosphor-icons/react/dist/csr/CalendarBlank';
import { useRef } from 'react';

import { deFechaIso, enmascararFecha, fechaMaximaNacimiento } from '../schemas/formatos';
import type { PropsSeccionRenaper } from './tiposFormulario';
import { TEXTOS_RENAPER } from './textosRenaper';

const AYUDA = 'Debe ser mayor de 18 años.';

/**
 * Fecha de nacimiento (D-B05-7): se escribe como `dd/mm/aaaa` o se elige en el calendario del
 * navegador, que completa el mismo campo. El calendario no deja elegir menores de 18 años.
 */
export function CampoFecha({ form, deshabilitado, esDatoRenaper }: PropsSeccionRenaper) {
  const { register, setValue, formState } = form;
  const calendario = useRef<HTMLInputElement>(null);
  const error = formState.errors.fechaNacimiento?.message;

  const abrirCalendario = () => {
    const entrada = calendario.current;
    if (!entrada) return;
    // `showPicker` no existe en todos los navegadores ni en jsdom: sin él, queda el campo de texto.
    if (typeof entrada.showPicker === 'function') entrada.showPicker();
  };

  return (
    <div className="flex flex-col gap-sp-8">
      <Input
        label="Fecha de nacimiento"
        inputMode="numeric"
        autoComplete="bday"
        maxLength={10}
        placeholder="dd/mm/aaaa"
        helper={error ?? (esDatoRenaper('fechaNacimiento') ? TEXTOS_RENAPER.leyenda : AYUDA)}
        error={error !== undefined}
        disabled={deshabilitado}
        {...register('fechaNacimiento', {
          onChange: (evento: { target: HTMLInputElement }) => {
            evento.target.value = enmascararFecha(evento.target.value);
          },
        })}
      />
      <div className="relative self-start">
        <Button
          label="Elegir en el calendario"
          variant="secondary"
          size="s"
          icon={<CalendarBlankIcon size={16} />}
          disabled={deshabilitado}
          onClick={abrirCalendario}
        />
        <input
          ref={calendario}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          max={fechaMaximaNacimiento()}
          className="pointer-events-none absolute left-0 top-0 h-0 w-0 opacity-0"
          onChange={(evento) => {
            if (!evento.target.value) return;
            setValue('fechaNacimiento', deFechaIso(evento.target.value), {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
        />
      </div>
    </div>
  );
}
