import {
  ESTADO_GRUPO,
  isApiError,
  type ClaveGeneradaResponse,
  type GrupoCuentaResponse,
} from '@nexa/api';
import { AlertaError, Button, CardWidget, Dialogo, EstadoBadge, toast } from '@nexa/ui';
import { useState } from 'react';

import { useGenerarClave } from '../api/useGenerarClave';

const MENSAJE_INESPERADO = 'No pudimos generar la clave. Probá de nuevo en unos minutos.';
const MENSAJE_COPIADA = 'Clave copiada.';
const MENSAJE_NO_COPIADA = 'No se pudo copiar. Seleccioná la clave y copiala a mano.';

const formatearFecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR');

function EstadoDeLaSolicitud({ cuenta }: { cuenta: GrupoCuentaResponse }) {
  switch (cuenta.estado) {
    case ESTADO_GRUPO.Pendiente:
      return (
        <div className="flex flex-col gap-sp-8">
          <EstadoBadge estado="Pendiente" texto="En revisión" />
          <p className="text-body-sm text-text-secondary">
            Recibimos tu solicitud el {formatearFecha(cuenta.fechaSolicitud)}. Un administrador de
            Nexa Seguros la revisa; cuando la apruebe vas a poder generar tu clave acá.
          </p>
        </div>
      );
    case ESTADO_GRUPO.Rechazada:
      return (
        <div className="flex flex-col gap-sp-8">
          <EstadoBadge estado="Vencida" texto="Rechazada" />
          <p className="text-body-sm text-text-secondary">
            Tu solicitud no fue aprobada.
            {cuenta.motivo ? ` Motivo: ${cuenta.motivo}` : ''}
          </p>
        </div>
      );
    case ESTADO_GRUPO.Revocada:
      return (
        <div className="flex flex-col gap-sp-8">
          <EstadoBadge estado="Cancelada" texto="Acceso revocado" />
          <p className="text-body-sm text-text-secondary">
            Tu acceso a la API fue retirado y tu clave dejó de funcionar.
            {cuenta.motivo ? ` Motivo: ${cuenta.motivo}` : ''}
          </p>
        </div>
      );
    default:
      return <EstadoBadge estado="Vigente" texto="Aprobada" />;
  }
}

function ClaveRecienGenerada({ clave }: { clave: ClaveGeneradaResponse }) {
  async function copiar() {
    try {
      await navigator.clipboard.writeText(clave.clave);
      toast.success(MENSAJE_COPIADA);
    } catch {
      toast.error(MENSAJE_NO_COPIADA);
    }
  }

  return (
    <div
      role="status"
      className="flex flex-col gap-sp-8 rounded-input border border-border-strong p-sp-16"
    >
      <p className="text-body-sm text-text-primary">
        Copiá tu clave ahora: por seguridad no la guardamos y no vamos a poder mostrártela de nuevo.
      </p>
      <p className="break-all font-mono text-body-sm text-text-primary">{clave.clave}</p>
      <div>
        <Button label="Copiar clave" variant="secondary" size="s" onClick={() => void copiar()} />
      </div>
    </div>
  );
}

function ResumenDeClave({
  cuenta,
  hayClaveNueva,
}: {
  cuenta: GrupoCuentaResponse;
  hayClaveNueva: boolean;
}) {
  if (hayClaveNueva) return null;
  if (!cuenta.tieneClave || !cuenta.clavePrefijo) {
    return <p className="text-body-sm text-text-secondary">Todavía no generaste tu clave.</p>;
  }
  return (
    <p className="text-body-sm text-text-secondary">
      Clave activa que empieza con{' '}
      <span className="font-mono text-text-primary">{cuenta.clavePrefijo}…</span>
      {cuenta.claveCreadaEn ? `, creada el ${formatearFecha(cuenta.claveCreadaEn)}` : ''}.
    </p>
  );
}

function mensajeDeError(e: unknown): string {
  return isApiError(e) && e.kind === 'http' && e.detail ? e.detail : MENSAJE_INESPERADO;
}

/** Generación de la clave de un grupo aprobado. Regenerarla invalida la anterior, por eso pide confirmar. */
function ZonaClave({ cuenta }: { cuenta: GrupoCuentaResponse }) {
  const generar = useGenerarClave();
  const [confirmando, setConfirmando] = useState(false);
  const [clave, setClave] = useState<ClaveGeneradaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function ejecutar() {
    setConfirmando(false);
    setError(null);
    generar.mutate(undefined, {
      onSuccess: setClave,
      onError: (e) => {
        if (isApiError(e) && e.status === 401) return; // La resuelve el cliente.
        setError(mensajeDeError(e));
      },
    });
  }

  return (
    <div className="flex flex-col gap-sp-16">
      {clave ? <ClaveRecienGenerada clave={clave} /> : null}
      <ResumenDeClave cuenta={cuenta} hayClaveNueva={clave !== null} />
      {error ? <AlertaError>{error}</AlertaError> : null}
      <div>
        <Button
          label={cuenta.tieneClave ? 'Generar clave nueva' : 'Generar clave'}
          variant="primary"
          size="m"
          disabled={generar.isPending}
          aria-busy={generar.isPending}
          onClick={() => (cuenta.tieneClave ? setConfirmando(true) : ejecutar())}
        />
      </div>
      {confirmando ? (
        <Dialogo
          titulo="Generar una clave nueva"
          descripcion="La clave actual deja de funcionar apenas la generes. Actualizala en tu sistema antes de seguir consultando."
          onCancelar={() => setConfirmando(false)}
        >
          <Button
            label="Cancelar"
            variant="secondary"
            data-foco-inicial
            onClick={() => setConfirmando(false)}
          />
          <Button label="Generar clave nueva" onClick={ejecutar} />
        </Dialogo>
      ) : null}
    </div>
  );
}

/**
 * Estado de la solicitud y generación de la clave. La clave solo se ve en la respuesta que la crea:
 * después queda su inicio, para distinguirla.
 */
export function ClavePanel({ cuenta }: { cuenta: GrupoCuentaResponse }) {
  return (
    <CardWidget title={`Tu cuenta: ${cuenta.nombre}`}>
      <div className="flex flex-col gap-sp-16">
        <EstadoDeLaSolicitud cuenta={cuenta} />
        {cuenta.estado === ESTADO_GRUPO.Aprobada ? <ZonaClave cuenta={cuenta} /> : null}
      </div>
    </CardWidget>
  );
}
