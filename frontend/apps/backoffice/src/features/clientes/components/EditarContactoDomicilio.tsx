import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError, type ClienteResponse } from '@nexa/api';
import { AlertaError, Button, Dialogo, Input, Select, toast } from '@nexa/ui';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { CLIENTE_NO_ENCONTRADO, mensajeMutacionCliente } from '../api/mensajeMutacionCliente';
import { useModificarCliente } from '../api/useModificarCliente';
import {
  modificacionClienteSchema,
  type ModificacionClienteCampos,
  type ModificacionClienteValidada,
} from '../schemas/modificacionClienteSchema';
import { OPCIONES_PROVINCIA } from '../schemas/provincias';

export function EditarContactoDomicilio({
  cliente,
  onCerrar,
}: {
  cliente: ClienteResponse;
  onCerrar: () => void;
}) {
  const modificacion = useModificarCliente(cliente.id);
  const enviando = useRef(false);
  const { register, control, handleSubmit, formState } = useForm<
    ModificacionClienteCampos,
    unknown,
    ModificacionClienteValidada
  >({
    resolver: zodResolver(modificacionClienteSchema),
    defaultValues: {
      email: cliente.email,
      telefono: cliente.telefono ?? '',
      calle: cliente.calle,
      numero: cliente.numero,
      localidad: cliente.localidad,
      provincia: cliente.provincia,
      codigoPostal: cliente.codigoPostal,
    },
  });
  const { errors, isSubmitting } = formState;

  const guardar = handleSubmit(async (cambios) => {
    if (enviando.current) return;
    enviando.current = true;
    try {
      await modificacion.mutateAsync(cambios);
      toast.success('Datos actualizados.');
      onCerrar();
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        toast.error(CLIENTE_NO_ENCONTRADO);
        onCerrar();
      }
    } finally {
      enviando.current = false;
    }
  });

  function cancelar() {
    if (!enviando.current) onCerrar();
  }

  function campo(nombre: keyof ModificacionClienteCampos) {
    const mensaje = errors[nombre]?.message;
    return {
      ...register(nombre),
      error: Boolean(mensaje),
      helper: mensaje,
      disabled: isSubmitting,
    };
  }

  return (
    <Dialogo titulo="Editar contacto y domicilio" rol="dialog" onCancelar={cancelar}>
      <form noValidate onSubmit={guardar} className="flex flex-col gap-sp-16">
        <fieldset disabled={isSubmitting} className="grid gap-sp-12 sm:grid-cols-2">
          <legend className="mb-sp-8 text-body text-text-primary">Contacto</legend>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            data-foco-inicial
            {...campo('email')}
          />
          <Input label="Teléfono" type="tel" autoComplete="tel" {...campo('telefono')} />
        </fieldset>
        <fieldset disabled={isSubmitting} className="grid gap-sp-12 sm:grid-cols-2">
          <legend className="mb-sp-8 text-body text-text-primary">Domicilio</legend>
          <Input label="Calle" {...campo('calle')} />
          <Input label="Número" {...campo('numero')} />
          <Input label="Localidad" {...campo('localidad')} />
          <Controller
            control={control}
            name="provincia"
            render={({ field, fieldState }) => (
              <Select
                {...field}
                label="Provincia"
                options={OPCIONES_PROVINCIA}
                disabled={isSubmitting}
                error={fieldState.invalid}
                helper={fieldState.error?.message}
              />
            )}
          />
          <Input label="Código postal" autoComplete="postal-code" {...campo('codigoPostal')} />
        </fieldset>
        {modificacion.isError ? (
          <AlertaError>
            {mensajeMutacionCliente(
              modificacion.error,
              'No pudimos guardar los cambios. Probá de nuevo.',
            )}
          </AlertaError>
        ) : null}
        <div className="flex flex-wrap justify-end gap-sp-8">
          <Button label="Cancelar" variant="secondary" disabled={isSubmitting} onClick={cancelar} />
          <Button
            label="Guardar cambios"
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          />
        </div>
      </form>
    </Dialogo>
  );
}
