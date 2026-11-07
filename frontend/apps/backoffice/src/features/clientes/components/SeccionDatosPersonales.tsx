import { Input, Select, type SelectOption } from '@nexa/ui';
import type { ReactNode } from 'react';
import { Controller } from 'react-hook-form';

import { enmascararCuil } from '../schemas/formatos';
import { CampoFecha } from './CampoFecha';
import { TEXTOS_RENAPER } from './textosRenaper';
import type { PropsSeccionRenaper } from './tiposFormulario';

interface PropsDatosPersonales extends PropsSeccionRenaper {
  /** Botón "Validar en Renaper": va en la fila del DNI (B4 §3). */
  accionRenaper: ReactNode;
  /** Texto del DNI cuando la consulta a Renaper lo invalida. */
  errorDniRenaper: string | undefined;
}

// B4 D-11: Femenino (F), Masculino (M) y X.
const OPCIONES_SEXO: readonly SelectOption<string>[] = [
  { value: 'F', label: 'Femenino' },
  { value: 'M', label: 'Masculino' },
  { value: 'X', label: 'X' },
];

export function SeccionDatosPersonales({
  form,
  deshabilitado,
  esDatoRenaper,
  accionRenaper,
  errorDniRenaper,
}: PropsDatosPersonales) {
  const { register, control, formState } = form;
  const { errors } = formState;
  const leyenda = (campo: Parameters<typeof esDatoRenaper>[0]) =>
    esDatoRenaper(campo) ? TEXTOS_RENAPER.leyenda : undefined;
  const mensajeDni = errors.dni?.message ?? errorDniRenaper;

  return (
    <fieldset disabled={deshabilitado} className="flex flex-col gap-sp-16 border-0 p-0">
      <legend className="mb-sp-16 text-h3 text-text-primary">Datos personales</legend>
      <div className="grid grid-cols-1 gap-sp-16 sm:grid-cols-2">
        <Input
          label="DNI"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          helper={mensajeDni}
          error={mensajeDni !== undefined}
          {...register('dni')}
        />
        {accionRenaper}
        <Controller
          control={control}
          name="sexo"
          render={({ field }) => (
            <Select
              label="Sexo"
              options={OPCIONES_SEXO}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              helper={errors.sexo?.message ?? leyenda('sexo')}
              error={errors.sexo !== undefined}
            />
          )}
        />
        <Input
          label="Nombre"
          autoComplete="given-name"
          maxLength={100}
          helper={errors.nombre?.message ?? leyenda('nombre')}
          error={errors.nombre !== undefined}
          {...register('nombre')}
        />
        <Input
          label="Apellido"
          autoComplete="family-name"
          maxLength={100}
          helper={errors.apellido?.message ?? leyenda('apellido')}
          error={errors.apellido !== undefined}
          {...register('apellido')}
        />
        <Input
          label="CUIL"
          inputMode="numeric"
          autoComplete="off"
          maxLength={13}
          helper={errors.cuil?.message ?? leyenda('cuil')}
          error={errors.cuil !== undefined}
          {...register('cuil', {
            onChange: (evento: { target: HTMLInputElement }) => {
              evento.target.value = enmascararCuil(evento.target.value);
            },
          })}
        />
        <CampoFecha form={form} deshabilitado={deshabilitado} esDatoRenaper={esDatoRenaper} />
      </div>
    </fieldset>
  );
}
