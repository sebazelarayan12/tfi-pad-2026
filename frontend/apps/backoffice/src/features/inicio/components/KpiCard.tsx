import { Button, Chip } from '@nexa/ui';
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
}

function CifraKpi({ valor }: { valor?: number }) {
  if (valor === undefined) return <p className="text-body-sm text-text-secondary">No disponible</p>;
  return <p className="text-h1 tabular-nums text-text-primary">{formatConteo(valor)}</p>;
}

function ContenidoKpi({ indicador, nota, chip, degradar }: Omit<KpiCardProps, 'titulo'>) {
  if (indicador.isPending) {
    return (
      <div
        role="status"
        aria-label="Cargando indicador"
        className="h-8 w-16 rounded-input bg-surface-subtle"
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

export function KpiCard({ titulo, ...contenido }: KpiCardProps) {
  return (
    <section className="flex min-h-[158px] min-w-0 flex-col gap-sp-8 rounded-card border border-border-hairline bg-surface-panel p-sp-20">
      <h2 className="text-label text-text-secondary">{titulo}</h2>
      <ContenidoKpi {...contenido} />
    </section>
  );
}
