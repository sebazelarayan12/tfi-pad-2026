import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError, type PlanRequest, type PlanResponse } from '@nexa/api';
import { AlertaError, Button, CardWidget, Input, toast } from '@nexa/ui';
import { useRef, useState } from 'react';
import { Controller, useForm, type UseFormSetError } from 'react-hook-form';
import { useActualizarPlan } from '../api/useActualizarPlan';
import { useCrearPlan } from '../api/useCrearPlan';
import { usePlan } from '../api/usePlan';
import { aPlanRequest, desdePlanResponse, MENSAJES_PLAN, planSchema } from '../schemas/planSchema';
import type { PlanFormValidado, PlanFormValues } from '../types/planes';
import { AntiguedadMaximaField } from './AntiguedadMaximaField';
import { PlanDescripcionField } from './PlanDescripcionField';
import { PrimaBaseField } from './PrimaBaseField';
import { TiposPermitidosChips } from './TiposPermitidosChips';

function mostrarError(error: unknown, setError: UseFormSetError<PlanFormValues>): string | null {
  if (!isApiError(error)) return 'Ocurrió un error inesperado.';
  if (error.status === 401) return null;
  const campos = Object.keys(MENSAJES_PLAN) as Array<keyof PlanFormValues>;
  const porCampo = new Set(Object.keys(error.errors ?? {}).map((clave) => clave.toLowerCase()));
  const conocidos = campos.filter((campo) => porCampo.has(campo.toLowerCase()));
  for (const campo of conocidos) {
    setError(campo, { type: 'server', message: MENSAJES_PLAN[campo] });
  }
  return conocidos.length > 0 ? null : (error.detail ?? 'Ocurrió un error inesperado.');
}

function FormularioPlan({
  plan,
  guardarPlan,
  onCreado,
  onCancelar,
}: {
  plan?: PlanResponse;
  guardarPlan: (body: PlanRequest) => Promise<PlanResponse>;
  onCreado?: (plan: PlanResponse) => void;
  onCancelar?: () => void;
}) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const enviando = useRef(false);
  const { register, control, handleSubmit, reset, setError, formState } = useForm<
    PlanFormValues,
    unknown,
    PlanFormValidado
  >({
    resolver: zodResolver(planSchema),
    defaultValues: plan
      ? desdePlanResponse(plan)
      : {
          codigo: '',
          nombre: '',
          descripcion: '',
          primaBase: '',
          tiposPermitidos: [],
          antiguedadMaxima: '',
        },
  });
  const { errors, isSubmitting } = formState;
  const nombreError = errors.nombre?.message;

  async function guardar(valores: PlanFormValidado) {
    if (enviando.current) return;
    enviando.current = true;
    setGuardado(false);
    setMensaje(null);
    try {
      const respuesta = await guardarPlan({
        ...aPlanRequest(valores),
        codigo: plan?.codigo ?? valores.codigo,
      });
      if (onCreado) {
        toast.success('Plan creado.');
        onCreado(respuesta);
        return;
      }
      reset(desdePlanResponse(respuesta));
      setGuardado(true);
    } catch (error) {
      setMensaje(mostrarError(error, setError));
    } finally {
      enviando.current = false;
    }
  }

  function cancelar() {
    onCancelar?.();
    reset();
    setMensaje(null);
    setGuardado(false);
  }

  return (
    <form noValidate onSubmit={handleSubmit(guardar)} className="flex flex-col gap-sp-20">
      <fieldset disabled={isSubmitting} className="flex flex-col gap-sp-20">
        {plan ? (
          <Input
            label="Código"
            value={plan.codigo}
            disabled
            error={Boolean(errors.codigo)}
            helper={errors.codigo?.message ?? 'El código no se puede cambiar.'}
          />
        ) : (
          <Input
            {...register('codigo')}
            label="Código"
            maxLength={10}
            error={Boolean(errors.codigo)}
            helper={errors.codigo?.message}
          />
        )}
        <Input
          {...register('nombre')}
          label="Nombre"
          error={Boolean(nombreError)}
          helper={nombreError}
        />
        <PlanDescripcionField campo={register('descripcion')} error={errors.descripcion?.message} />
        <PrimaBaseField control={control} />
        <Controller
          control={control}
          name="tiposPermitidos"
          render={({ field, fieldState }) => (
            <TiposPermitidosChips
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <AntiguedadMaximaField
          campo={register('antiguedadMaxima')}
          error={errors.antiguedadMaxima?.message}
        />
      </fieldset>
      {mensaje ? <AlertaError>{mensaje}</AlertaError> : null}
      <div role="status">{guardado ? 'Cambios guardados.' : null}</div>
      <div className="flex flex-wrap justify-end gap-sp-8">
        <Button label="Cancelar" variant="secondary" disabled={isSubmitting} onClick={cancelar} />
        <Button
          type="submit"
          label={isSubmitting ? 'Guardando…' : 'Guardar cambios'}
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
        />
      </div>
    </form>
  );
}

export function PlanCreatePanel({
  onCreado,
  onCancelar,
}: {
  onCreado: (plan: PlanResponse) => void;
  onCancelar: () => void;
}) {
  const { mutateAsync } = useCrearPlan();
  return (
    <CardWidget title="Nuevo plan">
      <FormularioPlan guardarPlan={mutateAsync} onCreado={onCreado} onCancelar={onCancelar} />
    </CardWidget>
  );
}

export function PlanEditPanel({
  id,
  codigo,
  estado,
}: {
  id: string;
  codigo: string;
  estado: React.ReactNode;
}) {
  const { mutateAsync } = useActualizarPlan(id);
  const consulta = usePlan(id);
  const error = isApiError(consulta.error) ? consulta.error.detail : null;
  return (
    <CardWidget title={`Editar plan ${codigo}`}>
      {estado}
      {consulta.isPending ? (
        <p role="status">Cargando plan…</p>
      ) : consulta.isError ? (
        <AlertaError>{error ?? 'No se pudo cargar el plan.'}</AlertaError>
      ) : (
        <FormularioPlan key={id} plan={consulta.data} guardarPlan={mutateAsync} />
      )}
    </CardWidget>
  );
}
