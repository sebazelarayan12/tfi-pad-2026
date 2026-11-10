import { isApiError, type GrupoListItemResponse } from '@nexa/api';
import { AlertaError, toast } from '@nexa/ui';
import { useState } from 'react';

import { useRol } from '../../auth';
import { useGrupos } from '../api/useGrupos';
import { useResolverGrupo } from '../api/useResolverGrupo';
import { GruposTable, type AccionFila } from '../components/GruposTable';
import { MotivoPanel } from '../components/MotivoPanel';

const MENSAJE_INESPERADO = 'Ocurrió un error inesperado.';

const MENSAJE_EXITO: Record<AccionFila, string> = {
  aprobar: 'Grupo aprobado.',
  rechazar: 'Solicitud rechazada.',
  revocar: 'Acceso revocado.',
};

/** `detail` del back si lo hay; `null` cuando el error no trae detalle (red, 500 sin cuerpo). */
function detalleDelError(error: unknown): string | null {
  return isApiError(error) && error.kind === 'http' ? (error.detail ?? null) : null;
}

interface PendienteDeMotivo {
  accion: 'rechazar' | 'revocar';
  grupo: GrupoListItemResponse;
}

function ContenidoGrupos() {
  const grupos = useGrupos();
  const resolver = useResolverGrupo();
  const [pendiente, setPendiente] = useState<PendienteDeMotivo | null>(null);
  const [error, setError] = useState<string | null>(null);

  function ejecutar(accion: AccionFila, grupo: GrupoListItemResponse, motivo?: string) {
    setError(null);
    const pedido =
      accion === 'aprobar'
        ? ({ tipo: 'aprobar', id: grupo.id } as const)
        : ({ tipo: accion, id: grupo.id, motivo: motivo ?? '' } as const);
    resolver.mutate(pedido, {
      onSuccess: () => {
        toast.success(MENSAJE_EXITO[accion]);
        setPendiente(null);
      },
      onError: (e) => {
        if (isApiError(e) && e.status === 401) return; // La resuelve el cliente.
        setError(detalleDelError(e) ?? MENSAJE_INESPERADO);
        setPendiente(null);
      },
    });
  }

  function alElegirAccion(accion: AccionFila, grupo: GrupoListItemResponse) {
    if (accion === 'aprobar') {
      ejecutar('aprobar', grupo);
      return;
    }
    setPendiente({ accion, grupo });
  }

  return (
    <section aria-label="Grupos externos" className="flex min-w-0 flex-col gap-sp-16">
      <p className="text-body-sm text-text-secondary">
        Grupos que piden consumir la API. Al aprobar uno, puede generar su propia clave desde
        Integraciones; al revocar, su clave deja de funcionar al instante.
      </p>
      {error ? <AlertaError>{error}</AlertaError> : null}
      {pendiente ? (
        <MotivoPanel
          key={`${pendiente.accion}-${pendiente.grupo.id}`}
          titulo={`${pendiente.accion === 'rechazar' ? 'Rechazar' : 'Revocar'} a ${pendiente.grupo.nombre}`}
          etiquetaConfirmar={
            pendiente.accion === 'rechazar' ? 'Rechazar solicitud' : 'Revocar acceso'
          }
          enviando={resolver.isPending}
          onCancelar={() => setPendiente(null)}
          onConfirmar={(motivo) => ejecutar(pendiente.accion, pendiente.grupo, motivo)}
        />
      ) : null}
      <GruposTable
        grupos={grupos.data?.items}
        cargando={grupos.isPending}
        errorDetalle={grupos.isError ? (detalleDelError(grupos.error) ?? '') : undefined}
        onAccion={alElegirAccion}
      />
    </section>
  );
}

/**
 * Grupos externos, solo Administrador. La guarda está acá y no en `RequireRol` porque un feature
 * no puede importar el app-shell (FB3-4).
 */
export function GruposPage() {
  const rol = useRol();
  if (rol !== 'Administrador') {
    return <p className="p-sp-24 text-text-primary">No tenés permiso para esta acción.</p>;
  }
  return <ContenidoGrupos />;
}
