import { AlertaError, Button, CardWidget } from '@nexa/ui';
import { useCuotasVencidas } from '../api/useCuotasVencidas';
import { TablaCuotasVencidas } from './TablaCuotasVencidas';

const filasSkeleton = [1, 2, 3, 4, 5];

function ContenidoCuotas() {
  const cuotas = useCuotasVencidas();
  if (cuotas.isPending) {
    return (
      <div role="status" aria-label="Cargando cuotas vencidas">
        {filasSkeleton.map((fila) => (
          <div
            key={fila}
            aria-hidden="true"
            className="flex h-[49px] items-center border-b border-border-hairline px-sp-16"
          >
            <div className="h-4 w-full rounded-input bg-surface-subtle" />
          </div>
        ))}
      </div>
    );
  }
  if (cuotas.isError) {
    return (
      <div className="flex flex-col items-start gap-sp-8">
        <AlertaError>No pudimos cargar las cuotas.</AlertaError>
        <Button
          label="Reintentar"
          size="s"
          variant="secondary"
          onClick={() => void cuotas.refetch()}
        />
      </div>
    );
  }
  if (cuotas.data.length === 0) return <p>No hay cuotas vencidas.</p>;
  return <TablaCuotasVencidas cuotas={cuotas.data} />;
}

export function WidgetCuotasVencidas() {
  return (
    <CardWidget title="Cuotas vencidas recientes">
      <ContenidoCuotas />
    </CardWidget>
  );
}
