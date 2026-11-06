import { ESTADO_CUOTA_NUMERO, formatearImporte, type PagoResponse } from '@nexa/api';
import { AlertaError, Button } from '@nexa/ui';
import { useRef, useState } from 'react';

import { useCobrarCuotas } from '../api/usePagos';
import { cobroCajaSchema } from '../schemas/cobroCaja';
import type { CuotaCobrable } from '../types/cobro';
import { CuotaCheckItem } from './CuotaCheckItem';
import { mensajeDeError } from './mensajesError';

export interface CobroCajaProps {
  cuotas: ReadonlyArray<CuotaCobrable>;
  etiquetaBoton: string;
  ayuda?: string;
  onCobrado?: (pago: PagoResponse) => void;
}

function esCobrable(cuota: CuotaCobrable): boolean {
  return (
    cuota.estado === ESTADO_CUOTA_NUMERO.Pendiente || cuota.estado === ESTADO_CUOTA_NUMERO.Vencida
  );
}

/**
 * Selección de cuotas impagas y cobro en caja (B11).
 * No muestra total previo (RV-D14): el importe confirmado sale de `PagoResponse.importe`.
 */
export function CobroCaja({ cuotas, etiquetaBoton, ayuda, onCobrado }: CobroCajaProps) {
  const [seleccionadas, setSeleccionadas] = useState<ReadonlySet<string>>(new Set());
  const [exito, setExito] = useState<PagoResponse | null>(null);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const enviandoRef = useRef(false);
  const mutacion = useCobrarCuotas();

  const cuotasCobrables = cuotas.filter(esCobrable);
  const deshabilitado = seleccionadas.size === 0 || mutacion.isPending;
  const mensajeError =
    errorValidacion ?? (mutacion.isError ? mensajeDeError(mutacion.error) : null);

  function alternarCuota(id: string, marcada: boolean) {
    mutacion.reset();
    setErrorValidacion(null);
    setExito(null);
    setSeleccionadas((anteriores) => {
      const siguientes = new Set(anteriores);
      if (marcada) siguientes.add(id);
      else siguientes.delete(id);
      return siguientes;
    });
  }

  function cobrar() {
    if (deshabilitado || enviandoRef.current) return;

    const resultado = cobroCajaSchema.safeParse({ cuotaIds: [...new Set(seleccionadas)] });
    if (!resultado.success) {
      setErrorValidacion(resultado.error.issues[0]?.message ?? 'Debe indicar al menos una cuota.');
      return;
    }

    enviandoRef.current = true;
    setErrorValidacion(null);
    setExito(null);
    mutacion.mutate(resultado.data, {
      onSuccess: (pago) => {
        setSeleccionadas(new Set());
        setExito(pago);
        onCobrado?.(pago);
      },
      onSettled: () => {
        enviandoRef.current = false;
      },
    });
  }

  const facturaPendiente = exito?.factura?.estado === 'PENDIENTE_CAE';

  return (
    <div className="flex flex-col gap-sp-12">
      {cuotasCobrables.length === 0 ? (
        <p className="text-body-sm text-text-secondary">No hay cuotas para cobrar.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border-hairline" aria-label="Cuotas impagas">
          {cuotasCobrables.map((cuota) => (
            <li key={cuota.id}>
              <CuotaCheckItem
                cuota={cuota}
                checked={seleccionadas.has(cuota.id)}
                disabled={mutacion.isPending}
                onCheckedChange={alternarCuota}
              />
            </li>
          ))}
        </ul>
      )}

      {mensajeError !== null ? <AlertaError>{mensajeError}</AlertaError> : null}

      {exito !== null ? (
        <div role="status" className="flex flex-col gap-sp-4 text-body-sm text-text-primary">
          <p>
            {facturaPendiente
              ? 'Pago registrado. La factura quedó pendiente de CAE.'
              : 'Pago registrado.'}
          </p>
          <p className="font-mono text-mono">Importe: {formatearImporte(exito.importe)}</p>
        </div>
      ) : null}

      <Button
        label={etiquetaBoton}
        variant="primary"
        size="m"
        onClick={cobrar}
        disabled={deshabilitado}
        aria-disabled={deshabilitado}
      />
      {ayuda !== undefined ? <p className="text-label text-text-secondary">{ayuda}</p> : null}
    </div>
  );
}
