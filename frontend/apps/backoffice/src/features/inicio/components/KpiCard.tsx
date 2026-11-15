import { Button, Chip } from '@nexa/ui';
import type { ReactNode } from 'react';
import { useConteoAnimado } from '../../../marca/movimiento/useConteoAnimado';
import { formatConteo } from '../schemas/distribucionPolizas';
import type { Indicador } from '../types/indicadores';

export function EstadoIndicador({ reintentar }: { reintentar: () => void }) {
  return (
    <div className="flex flex-col items-start gap-sp-8">
      <p role="status">No pudimos cargar este dato.</p>
      <Button label="Reintentar" variant="secondary" size="s" onClick={reintentar} />
    </div>
  );
}

interface KpiCardProps {
  titulo: string;
  indicador: Indicador;
  nota?: string;
  chip?: string;
  degradar?: boolean;
  /** Ícono decorativo y color de estado que lo acompaña. */
  icono?: ReactNode;
  tono?: TonoKpi;
}

export type TonoKpi = 'vigente' | 'pendiente' | 'suspendida' | 'cancelada';

const TONOS: Record<TonoKpi, string> = {
  vigente: 'bg-status-vigente-bg text-status-vigente-text',
  pendiente: 'bg-status-pendiente-bg text-status-pendiente-text',
  suspendida: 'bg-status-suspendida-bg text-status-suspendida-text',
  cancelada: 'bg-status-cancelada-bg text-status-cancelada-text',
};

function CifraAnimada({ valor }: { valor: number }) {
  const mostrado = useConteoAnimado(valor);
  return <p className="text-h1 tabular-nums text-text-primary">{formatConteo(mostrado)}</p>;
}

function CifraKpi({ valor }: { valor?: number }) {
  if (valor === undefined) return <p className="text-body-sm text-text-secondary">No disponible</p>;
  return <CifraAnimada valor={valor} />;
}

function ContenidoKpi({
  indicador,
  nota,
  chip,
  degradar,
}: Omit<KpiCardProps, 'titulo' | 'icono' | 'tono'>) {
  if (indicador.isPending) {
    return (
      <div
        role="status"
        aria-label="Cargando indicador"
        className="nx-brillo h-8 w-16 rounded-input bg-surface-subtle"
      />
    );
  }
  if (indicador.isError && !degradar) {
    return <EstadoIndicador reintentar={() => void indicador.refetch()} />;
  }
  return (
    <>
      <CifraKpi valor={indicador.isError ? undefined : indicador.data} />
      {nota ? <p className="text-caption text-text-secondary">{nota}</p> : null}
      {chip ? (
        <div>
          <Chip tipo="destacado" label={chip} />
        </div>
      ) : null}
    </>
  );
}

export function KpiCard({ titulo, icono, tono = 'pendiente', ...contenido }: KpiCardProps) {
  return (
    <section className="nx-tarjeta-viva flex min-h-[158px] min-w-0 flex-col gap-sp-8 rounded-card border border-border-hairline bg-surface-panel p-sp-20">
      <div className="flex items-start justify-between gap-sp-8">
        <h2 className="text-label text-text-secondary">{titulo}</h2>
        {icono ? (
          <span
            aria-hidden="true"
            className={`nx-icono-kpi inline-flex size-9 shrink-0 items-center justify-center rounded-input ${TONOS[tono]}`}
          >
            {icono}
          </span>
        ) : null}
      </div>
      <ContenidoKpi {...contenido} />
    </section>
  );
}
