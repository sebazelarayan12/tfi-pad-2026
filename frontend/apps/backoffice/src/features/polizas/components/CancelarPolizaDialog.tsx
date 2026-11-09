import { isApiError, leerMensajeDetalle } from '@nexa/api';
import { AlertaError, Button, Dialogo, Input, toast } from '@nexa/ui';
import { useEffect, useRef, useState } from 'react';

import { useCancelarPoliza } from '../api/useCancelarPoliza';
import { largo, MOTIVO_MAXIMO } from '../lib/motivo';
import {
  cancelarPolizaSchema,
  MSG_MOTIVO_LARGO,
  MSG_MOTIVO_VACIO,
} from '../schemas/cancelarPolizaSchema';
import {
  contadorMotivo,
  LABEL_MOTIVO,
  TEXTO_CANCELANDO,
  TEXTO_CONFIRMAR_CANCELACION,
  TEXTO_DIALOGO_CANCELAR,
  TEXTO_ERROR_RED_CANCELAR,
  TEXTO_EXITO_CANCELACION,
  TEXTO_VOLVER,
  TITULO_DIALOGO_CANCELAR,
} from '../textosDetalle';

const FOCALIZABLES = 'input, button:not([disabled]), [href], select, textarea';
const ID_ERROR_MOTIVO = 'motivo-cancelacion-error';

function tieneErrorDeMotivo(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.errors !== null &&
    Object.keys(error.errors).some((clave) => clave.toLowerCase() === 'motivo')
  );
}

function mensajeGeneral(error: unknown): string {
  if (isApiError(error) && error.kind !== 'red' && error.status !== 0) {
    return leerMensajeDetalle(error).mensaje;
  }
  return TEXTO_ERROR_RED_CANCELAR;
}

/** Mantiene Tab y Shift+Tab dentro del diálogo, también donde `showModal` no existe. */
function atraparFoco(formulario: HTMLFormElement, evento: KeyboardEvent) {
  if (evento.key !== 'Tab') return;
  const controles = Array.from(formulario.querySelectorAll<HTMLElement>(FOCALIZABLES));
  const primero = controles[0];
  const ultimo = controles[controles.length - 1];
  if (!primero || !ultimo) return;
  if (evento.shiftKey && document.activeElement === primero) {
    evento.preventDefault();
    ultimo.focus();
  } else if (!evento.shiftKey && document.activeElement === ultimo) {
    evento.preventDefault();
    primero.focus();
  }
}

export interface CancelarPolizaDialogProps {
  polizaId: string;
  numero: string;
  onCerrar: () => void;
}

/** Diálogo de cancelación (B10 §6): motivo obligatorio de 1 a 200 caracteres, una sola request. */
export function CancelarPolizaDialog({ polizaId, numero, onCerrar }: CancelarPolizaDialogProps) {
  const [motivo, setMotivo] = useState('');
  const enviando = useRef(false);
  const formulario = useRef<HTMLFormElement>(null);
  const cancelacion = useCancelarPoliza(polizaId);

  useEffect(() => {
    const elemento = formulario.current;
    if (!elemento) return;
    const alPresionar = (evento: KeyboardEvent) => atraparFoco(elemento, evento);
    elemento.addEventListener('keydown', alPresionar);
    return () => elemento.removeEventListener('keydown', alPresionar);
  }, []);

  const cantidad = largo(motivo);
  const errorLocal = cantidad > MOTIVO_MAXIMO ? MSG_MOTIVO_LARGO : null;
  const errorDelBack = tieneErrorDeMotivo(cancelacion.error)
    ? cantidad === 0
      ? MSG_MOTIVO_VACIO
      : MSG_MOTIVO_LARGO
    : null;
  const errorCampo = errorLocal ?? errorDelBack;
  const errorGeneral =
    cancelacion.isError && errorDelBack === null ? mensajeGeneral(cancelacion.error) : null;
  const deshabilitado = cantidad === 0 || errorLocal !== null || cancelacion.isPending;

  function cerrar() {
    if (!enviando.current) onCerrar();
  }

  function confirmar() {
    const valido = cancelarPolizaSchema.safeParse({ motivo });
    if (!valido.success || enviando.current) return;
    enviando.current = true;
    cancelacion.mutate(valido.data.motivo, {
      onSuccess: () => {
        toast.success(TEXTO_EXITO_CANCELACION);
        onCerrar();
      },
      onSettled: () => {
        enviando.current = false;
      },
    });
  }

  return (
    <Dialogo
      titulo={TITULO_DIALOGO_CANCELAR(numero)}
      descripcion={TEXTO_DIALOGO_CANCELAR}
      rol="dialog"
      onCancelar={cerrar}
    >
      <form
        ref={formulario}
        noValidate
        className="flex flex-col gap-sp-16"
        onSubmit={(evento) => {
          evento.preventDefault();
          confirmar();
        }}
      >
        <Input
          label={LABEL_MOTIVO}
          value={motivo}
          onChange={(evento) => setMotivo(evento.target.value)}
          helper={contadorMotivo(cantidad)}
          error={errorCampo !== null}
          aria-errormessage={errorCampo !== null ? ID_ERROR_MOTIVO : undefined}
          autoComplete="off"
          data-foco-inicial
        />
        {errorCampo !== null ? (
          <p id={ID_ERROR_MOTIVO} role="alert" className="text-body-sm text-status-cancelada-text">
            {errorCampo}
          </p>
        ) : null}
        {errorGeneral !== null ? <AlertaError>{errorGeneral}</AlertaError> : null}
        <p aria-live="polite" className="sr-only">
          {cancelacion.isPending ? TEXTO_CANCELANDO : ''}
        </p>
        <div className="flex flex-wrap justify-end gap-sp-8">
          <Button
            type="button"
            label={TEXTO_VOLVER}
            variant="secondary"
            disabled={cancelacion.isPending}
            onClick={cerrar}
          />
          <Button
            type="submit"
            label={TEXTO_CONFIRMAR_CANCELACION}
            variant="primary"
            disabled={deshabilitado}
            aria-busy={cancelacion.isPending}
          />
        </div>
      </form>
    </Dialogo>
  );
}
