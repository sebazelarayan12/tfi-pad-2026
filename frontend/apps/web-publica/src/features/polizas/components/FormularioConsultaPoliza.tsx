import { LockKeyIcon } from '@phosphor-icons/react/dist/csr/LockKey';
import { Button, Input } from '@nexa/ui';
import type { FormEventHandler } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import type { ConsultaFormValues } from '../schemas/consulta';

export const AYUDA_DNI = 'Sin puntos ni espacios.';
export const AYUDA_NUMERO_POLIZA = 'Los datos figuran en tu póliza.';
export const TEXTO_PRIVACIDAD = 'Tus datos viajan cifrados y no se guardan en este dispositivo.';
export const TEXTO_CONSULTAR = 'Consultar';
export const TEXTO_CONSULTANDO = 'Consultando…';

// El Figma escribe el DNI y el número de póliza en Nexa/Mono 13/18 (nodos I18:108;11:49 e I18:113;11:49).
const CAMPO_MONO = 'font-mono text-mono';

export interface FormularioConsultaPolizaProps {
  register: UseFormRegister<ConsultaFormValues>;
  errors: FieldErrors<ConsultaFormValues>;
  enviando: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

/**
 * Presentación de W2 (`W2-consultar-poliza.md` §3.1 y §11): card de 560 px en desktop (sin card en
 * mobile, como W2m), dos `Input` con label visible, botón full width y fila de privacidad. La validación y la mutación viven en la
 * página; este componente solo recibe el registro de react-hook-form.
 */
export function FormularioConsultaPoliza({
  register,
  errors,
  enviando,
  onSubmit,
}: FormularioConsultaPolizaProps) {
  return (
    <form
      noValidate
      autoComplete="off"
      aria-busy={enviando}
      onSubmit={onSubmit}
      className="flex w-full flex-col gap-sp-16 md:max-w-[560px] md:gap-sp-20 md:rounded-card md:border md:border-border-hairline md:bg-white md:p-sp-48 lg:max-w-none"
    >
      <h1 className="text-titulo-lg md:text-titulo-xl">Consultá tu póliza</h1>
      <p className="text-body-lg text-text-secondary">
        Ingresá tu DNI y el número de póliza para ver su estado y pagar sus cuotas.
      </p>

      <Input
        label="DNI"
        placeholder="30123456"
        inputMode="numeric"
        autoComplete="off"
        maxLength={8}
        className={CAMPO_MONO}
        helper={errors.dni?.message ?? AYUDA_DNI}
        error={errors.dni !== undefined}
        {...register('dni')}
      />

      <Input
        label="Número de póliza"
        placeholder="POL-0000042"
        autoComplete="off"
        className={CAMPO_MONO}
        helper={errors.numeroPoliza?.message ?? AYUDA_NUMERO_POLIZA}
        error={errors.numeroPoliza !== undefined}
        {...register('numeroPoliza')}
      />

      <Button
        type="submit"
        label={enviando ? TEXTO_CONSULTANDO : TEXTO_CONSULTAR}
        disabled={enviando}
        className="mt-sp-8 h-12 w-full rounded-boton text-body-lg font-medium"
      />

      <p className="flex items-start gap-sp-8 text-body-sm text-text-secondary">
        <span aria-hidden="true" className="shrink-0">
          <LockKeyIcon size={16} weight="regular" />
        </span>
        {TEXTO_PRIVACIDAD}
      </p>
    </form>
  );
}
