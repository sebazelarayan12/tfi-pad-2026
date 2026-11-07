import { Input } from '@nexa/ui';

import type { PropsSeccion } from './tiposFormulario';

export function SeccionContacto({ form, deshabilitado }: PropsSeccion) {
  const { register, formState } = form;
  const { errors } = formState;

  return (
    <fieldset disabled={deshabilitado} className="flex flex-col gap-sp-16 border-0 p-0">
      <legend className="mb-sp-16 text-h3 text-text-primary">Contacto</legend>
      <div className="grid grid-cols-1 gap-sp-16 sm:grid-cols-2">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          maxLength={150}
          helper={errors.email?.message}
          error={errors.email !== undefined}
          {...register('email')}
        />
        <Input
          label="Teléfono"
          type="tel"
          autoComplete="tel"
          maxLength={20}
          helper={errors.telefono?.message ?? 'Con código de área. Opcional.'}
          error={errors.telefono !== undefined}
          {...register('telefono')}
        />
      </div>
    </fieldset>
  );
}
