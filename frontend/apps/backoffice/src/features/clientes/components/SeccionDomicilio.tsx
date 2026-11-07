import { Input, Select } from '@nexa/ui';
import { Controller } from 'react-hook-form';

import { OPCIONES_PROVINCIA } from '../schemas/provincias';
import type { PropsSeccion } from './tiposFormulario';

export function SeccionDomicilio({ form, deshabilitado }: PropsSeccion) {
  const { register, control, formState } = form;
  const { errors } = formState;

  return (
    <fieldset disabled={deshabilitado} className="flex flex-col gap-sp-16 border-0 p-0">
      <legend className="mb-sp-16 text-h3 text-text-primary">Domicilio</legend>
      <div className="grid grid-cols-1 gap-sp-16 sm:grid-cols-2">
        <Input
          label="Calle"
          autoComplete="address-line1"
          maxLength={150}
          helper={errors.calle?.message}
          error={errors.calle !== undefined}
          {...register('calle')}
        />
        <Input
          label="Número"
          inputMode="numeric"
          autoComplete="off"
          maxLength={20}
          helper={errors.numero?.message}
          error={errors.numero !== undefined}
          {...register('numero')}
        />
        <Input
          label="Localidad"
          autoComplete="address-level2"
          maxLength={100}
          helper={errors.localidad?.message}
          error={errors.localidad !== undefined}
          {...register('localidad')}
        />
        <Controller
          control={control}
          name="provincia"
          render={({ field }) => (
            <Select
              label="Provincia"
              options={OPCIONES_PROVINCIA}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              helper={errors.provincia?.message}
              error={errors.provincia !== undefined}
            />
          )}
        />
        <Input
          label="Código postal"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={10}
          helper={errors.codigoPostal?.message}
          error={errors.codigoPostal !== undefined}
          {...register('codigoPostal')}
        />
      </div>
    </fieldset>
  );
}
