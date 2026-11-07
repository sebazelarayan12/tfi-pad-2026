import { Input, Select, type SelectOption } from '@nexa/ui';
import { Controller } from 'react-hook-form';

import { enmascararCuil } from '../schemas/formatos';
import { CampoFecha } from './CampoFecha';
import type { PropsSeccion } from './tiposFormulario';

// B4 D-11: Femenino (F), Masculino (M) y X.
const OPCIONES_SEXO: readonly SelectOption<string>[] = [
  { value: 'F', label: 'Femenino' },
  { value: 'M', label: 'Masculino' },
  { value: 'X', label: 'X' },
];

export function SeccionDatosPersonales({ form, deshabilitado }: PropsSeccion) {
  const { register, control, formState } = form;
  const { errors } = formState;

  return (
    <fieldset disabled={deshabilitado} className="flex flex-col gap-sp-16 border-0 p-0">
      <legend className="mb-sp-16 text-h3 text-text-primary">Datos personales</legend>
      <div className="grid grid-cols-1 gap-sp-16 sm:grid-cols-2">
        <Input
          label="DNI"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          helper={errors.dni?.message}
          error={errors.dni !== undefined}
          {...register('dni')}
        />
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
              helper={errors.sexo?.message}
              error={errors.sexo !== undefined}
            />
          )}
        />
        <Input
          label="Nombre"
          autoComplete="given-name"
          maxLength={100}
          helper={errors.nombre?.message}
          error={errors.nombre !== undefined}
          {...register('nombre')}
        />
        <Input
          label="Apellido"
          autoComplete="family-name"
          maxLength={100}
          helper={errors.apellido?.message}
          error={errors.apellido !== undefined}
          {...register('apellido')}
        />
        <Input
          label="CUIL"
          inputMode="numeric"
          autoComplete="off"
          maxLength={13}
          helper={errors.cuil?.message}
          error={errors.cuil !== undefined}
          {...register('cuil', {
            onChange: (evento: { target: HTMLInputElement }) => {
              evento.target.value = enmascararCuil(evento.target.value);
            },
          })}
        />
        <CampoFecha form={form} deshabilitado={deshabilitado} />
      </div>
    </fieldset>
  );
}
