import { isApiError, type PlanResponse } from '@nexa/api';
import { AlertaError, Button, Dialogo, toast } from '@nexa/ui';
import { useRef } from 'react';
import { useDesactivarPlan } from '../api/useDesactivarPlan';

export function ConfirmarDesactivarDialog({
  plan,
  onCancelar,
  onDesactivado,
}: {
  plan: PlanResponse;
  onCancelar: () => void;
  onDesactivado: (id: string) => void;
}) {
  const { mutate, isPending, error } = useDesactivarPlan();
  const enviando = useRef(false);
  const mensaje = isApiError(error) ? error.detail : null;
  function cancelar() {
    if (!enviando.current) onCancelar();
  }
  function confirmar() {
    if (enviando.current) return;
    enviando.current = true;
    mutate(plan.id, {
      onSuccess: () => {
        toast.success('Plan desactivado.');
        onDesactivado(plan.id);
      },
      onSettled: () => {
        enviando.current = false;
      },
    });
  }
  return (
    <Dialogo
      titulo={`Desactivar plan ${plan.codigo}`}
      descripcion="El plan deja de aparecer en la lista pública y no se puede cotizar. Las pólizas ya emitidas no cambian."
      onCancelar={cancelar}
    >
      {error ? <AlertaError>{mensaje ?? 'No se pudo desactivar el plan.'}</AlertaError> : null}
      <div className="flex justify-end gap-sp-8">
        <Button
          label="Cancelar"
          variant="secondary"
          data-foco-inicial
          disabled={isPending}
          onClick={cancelar}
        />
        <Button label="Desactivar plan" disabled={isPending} onClick={confirmar} />
      </div>
    </Dialogo>
  );
}
