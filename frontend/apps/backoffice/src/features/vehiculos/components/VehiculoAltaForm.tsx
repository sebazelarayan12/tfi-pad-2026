import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError, etiquetaEnum } from '@nexa/api';
import { Button, Input, Select, toast } from '@nexa/ui';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { errorAlta } from '../api/errorAlta';
import {
  altaInicial,
  vehiculoAltaSchema,
  type VehiculoAltaValues,
} from '../schemas/vehiculoAltaSchema';

const opcionesUso = [
  { value: '0', label: etiquetaEnum('UsoVehiculo', 0) },
  { value: '1', label: etiquetaEnum('UsoVehiculo', 1) },
] as const;

interface Props {
  habilitado: boolean;
  guardando: boolean;
  onGuardar: (valores: VehiculoAltaValues) => Promise<unknown>;
  onCancelar: () => void;
}

export function VehiculoAltaForm({ habilitado, guardando, onGuardar, onCancelar }: Props) {
  const enCurso = useRef(false);
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<VehiculoAltaValues>({
    resolver: zodResolver(vehiculoAltaSchema),
    defaultValues: altaInicial,
  });
  const ocupado = guardando || isSubmitting;
  const errorDeServidor = errors.patente?.type === 'server';

  useEffect(() => {
    if (habilitado) setFocus('patente');
  }, [habilitado, setFocus]);

  useEffect(() => {
    if (errorDeServidor && !ocupado && habilitado) setFocus('patente');
  }, [errorDeServidor, ocupado, habilitado, setFocus]);

  async function guardar(valores: VehiculoAltaValues) {
    if (!habilitado || enCurso.current) return;
    enCurso.current = true;
    try {
      await onGuardar(valores);
    } catch (error) {
      // El cliente HTTP resuelve 401 y la página cambia de estado si desapareció el cliente.
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) return;
      const aviso = errorAlta(error);
      if (aviso.campo) setError(aviso.campo, { type: 'server', message: aviso.mensaje });
      else toast.error(aviso.mensaje);
    } finally {
      enCurso.current = false;
    }
  }

  const patente = register('patente');
  const deshabilitado = !habilitado || ocupado;
  return (
    <form
      noValidate
      aria-label="Alta de vehículo"
      className="flex min-w-0 flex-col gap-sp-24 rounded-card border border-border-hairline bg-surface-panel p-sp-24"
      onSubmit={(evento) => void handleSubmit(guardar)(evento)}
    >
      <div className="grid items-start gap-sp-16 sm:grid-cols-2">
        <div aria-live="polite">
          <Input
            {...patente}
            onChange={(evento) => {
              evento.currentTarget.value = evento.currentTarget.value.toUpperCase();
              void patente.onChange(evento);
            }}
            label="Patente"
            helper={errors.patente?.message ?? 'Formato AB123CD o ABC123'}
            error={Boolean(errors.patente)}
            disabled={deshabilitado}
            required
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />
        </div>
        <Controller
          control={control}
          name="uso"
          render={({ field }) => (
            <Select
              {...field}
              label="Uso"
              options={opcionesUso}
              required
              helper="Comercial aplica factor 1,40 en la cotización."
              disabled={deshabilitado}
            />
          )}
        />
      </div>
      <div className="flex flex-wrap justify-end gap-sp-12">
        <Button
          label="Cancelar"
          variant="secondary"
          disabled={deshabilitado}
          onClick={onCancelar}
        />
        <Button
          label="Guardar vehículo"
          type="submit"
          disabled={deshabilitado}
          aria-busy={ocupado}
        />
      </div>
    </form>
  );
}
