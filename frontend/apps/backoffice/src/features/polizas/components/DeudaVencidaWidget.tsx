import { ESTADO_CUOTA_NUMERO, formatearImporte, type CuotaResponse } from '@nexa/api';
import { CardWidget } from '@nexa/ui';
import { useState } from 'react';

import { CobrarVencidasButton, textoCuotas } from '../../pagos';
import { importeCuota } from '../lib/importeCuota';
import {
  TEXTO_CUOTAS_A_ADELANTAR,
  TEXTO_CUOTAS_A_COBRAR,
  TEXTO_SIN_VENCIDAS,
  TEXTO_TOTAL_A_COBRAR,
  TITULO_DEUDA_VENCIDA,
  detalleVencidas,
} from '../textosDetalle';

interface ListaCuotasProps {
  legend: string;
  cuotas: ReadonlyArray<CuotaResponse>;
  elegidas: ReadonlySet<string>;
  onAlternar: (id: string) => void;
}

/** Cuotas con casilla para elegir cuáles cobrar. */
function ListaCuotas({ legend, cuotas, elegidas, onAlternar }: ListaCuotasProps) {
  return (
    <fieldset className="m-0 flex flex-col gap-sp-8 border-0 p-0">
      <legend className="mb-sp-8 text-body-sm text-text-secondary">{legend}</legend>
      {cuotas.map((cuota) => (
        <label key={cuota.id} className="flex items-center justify-between gap-sp-8 text-body-sm">
          <span className="flex items-center gap-sp-8">
            <input
              type="checkbox"
              checked={elegidas.has(cuota.id)}
              onChange={() => onAlternar(cuota.id)}
            />
            Cuota {cuota.numero}
          </span>
          <span className="font-mono">{formatearImporte(enCentavos(cuota) / 100)}</span>
        </label>
      ))}
    </fieldset>
  );
}

const enCentavos = (cuota: CuotaResponse) => Math.round(importeCuota(cuota) * 100);
const sumaCentavos = (cuotas: ReadonlyArray<CuotaResponse>) =>
  cuotas.reduce((suma, cuota) => suma + enCentavos(cuota), 0);

/**
 * Widget Deuda vencida: suma informativa de `importe + recargo` de las cuotas Vencida.
 * El empleado elige qué vencidas cobrar (D-B18-01 opción B, sin ninguna marcada de entrada);
 * el total a cobrar se suma acá solo como ayuda, el back calcula el importe real.
 * El cobro lo hace `CobrarVencidasButton` de B-17.
 */
export function DeudaVencidaWidget({
  polizaId,
  cuotas,
}: {
  polizaId: string;
  cuotas: ReadonlyArray<CuotaResponse>;
}) {
  const vencidas = cuotas
    .filter((cuota) => cuota.estado === ESTADO_CUOTA_NUMERO.Vencida)
    .sort((a, b) => a.numero - b.numero);
  // Cuotas que todavía no vencieron: se pueden pagar por adelantado (RN11).
  const proximas = cuotas
    .filter((cuota) => cuota.estado === ESTADO_CUOTA_NUMERO.Pendiente)
    .sort((a, b) => a.numero - b.numero);
  const [elegidas, setElegidas] = useState<ReadonlySet<string>>(new Set());
  // Derivada de las vencidas actuales: una cuota que ya no está vencida deja de contar.
  const seleccionadas = [...vencidas, ...proximas].filter((cuota) => elegidas.has(cuota.id));

  function alternar(id: string) {
    setElegidas((previas) => {
      const siguientes = new Set(previas);
      if (!siguientes.delete(id)) siguientes.add(id);
      return siguientes;
    });
  }

  return (
    <CardWidget title={TITULO_DEUDA_VENCIDA}>
      <div className="flex flex-col gap-sp-12">
        {vencidas.length > 0 ? (
          <>
            <p className="font-mono text-mono-lg text-status-cancelada-text">
              {formatearImporte(sumaCentavos(vencidas) / 100)}
            </p>
            <p className="text-body-sm text-text-secondary">
              {detalleVencidas(textoCuotas(vencidas.map((cuota) => cuota.numero)), vencidas.length)}
            </p>
            <ListaCuotas
              legend={TEXTO_CUOTAS_A_COBRAR}
              cuotas={vencidas}
              elegidas={elegidas}
              onAlternar={alternar}
            />
          </>
        ) : (
          <p className="text-body-sm text-text-secondary">{TEXTO_SIN_VENCIDAS}</p>
        )}
        {proximas.length > 0 ? (
          <ListaCuotas
            legend={TEXTO_CUOTAS_A_ADELANTAR}
            cuotas={proximas}
            elegidas={elegidas}
            onAlternar={alternar}
          />
        ) : null}
        <p className="flex items-center justify-between gap-sp-8 text-body-sm">
          <span>{TEXTO_TOTAL_A_COBRAR}</span>
          <span className="font-mono">{formatearImporte(sumaCentavos(seleccionadas) / 100)}</span>
        </p>
        <CobrarVencidasButton
          polizaId={polizaId}
          cuotas={cuotas}
          cuotaIds={seleccionadas.map((cuota) => cuota.id)}
        />
      </div>
    </CardWidget>
  );
}
