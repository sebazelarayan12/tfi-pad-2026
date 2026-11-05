import { CardWidget } from '@nexa/ui';
import { formatConteo, porcentajePolizas, segmentosPolizas } from '../schemas/distribucionPolizas';
import { ESTADOS_POLIZA, type EstadoPolizaInicio, type Indicador } from '../types/indicadores';
import { EstadoIndicador } from './KpiCard';

const COLOR = {
  Vigente: 'var(--nexa-status-vigente-text)',
  Pendiente: 'var(--nexa-status-pendiente-text)',
  Suspendida: 'var(--nexa-status-suspendida-text)',
  Cancelada: 'var(--nexa-status-cancelada-text)',
  Vencida: 'var(--nexa-status-vencida-text)',
};

export function DonutPolizasPorEstado({
  conteos,
  total,
}: {
  conteos: Record<EstadoPolizaInicio, Indicador>;
  total?: number;
}) {
  const fallidos = ESTADOS_POLIZA.filter((estado) => conteos[estado].isError);
  if (fallidos.length > 0) {
    return (
      <CardWidget title="Pólizas por estado">
        <EstadoIndicador
          reintentar={() => void Promise.all(fallidos.map((estado) => conteos[estado].refetch()))}
        />
      </CardWidget>
    );
  }
  if (total === undefined) {
    return (
      <CardWidget title="Pólizas por estado">
        <div
          role="status"
          aria-label="Cargando distribución"
          className="mx-auto h-40 w-40 rounded-full border-[12px] border-surface-subtle"
        />
      </CardWidget>
    );
  }

  const valores = ESTADOS_POLIZA.map((estado) => conteos[estado].data ?? 0);
  const segmentos = segmentosPolizas(valores, total);

  return (
    <CardWidget title="Pólizas por estado">
      <div className="relative mx-auto mb-sp-16 grid h-40 w-40 place-items-center">
        <svg viewBox="0 0 160 160" aria-hidden="true" className="absolute inset-0 h-full w-full">
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="var(--nexa-surface-subtle)"
            strokeWidth="14"
          />
          {ESTADOS_POLIZA.map((estado, indice) => {
            const segmento = segmentos[indice];
            if (segmento.longitud === 0) return null;
            return (
              <circle
                key={estado}
                cx="80"
                cy="80"
                r="70"
                pathLength="100"
                fill="none"
                stroke={COLOR[estado]}
                strokeWidth="14"
                strokeDasharray={`${segmento.longitud} 100`}
                strokeDashoffset={-segmento.offset}
                transform="rotate(-90 80 80)"
              />
            );
          })}
        </svg>
        <div className="relative text-center">
          <p className="text-h1 tabular-nums text-text-primary">{formatConteo(total)}</p>
          <p>pólizas</p>
        </div>
      </div>
      <ul className="flex flex-col gap-sp-8">
        {ESTADOS_POLIZA.map((estado, indice) => (
          <li
            key={estado}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-sp-8 tabular-nums"
          >
            <span className="flex items-center gap-sp-8">
              <svg aria-hidden="true" viewBox="0 0 8 8" className="h-2 w-2 shrink-0">
                <circle cx="4" cy="4" r="4" fill={COLOR[estado]} />
              </svg>
              {estado}
            </span>
            <span>{formatConteo(valores[indice])}</span>
            <span>{porcentajePolizas(valores[indice], total)}%</span>
          </li>
        ))}
      </ul>
    </CardWidget>
  );
}
