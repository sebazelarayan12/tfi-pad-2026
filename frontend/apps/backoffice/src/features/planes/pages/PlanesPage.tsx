import { isApiError, type PlanResponse } from '@nexa/api';
import { AlertaError, CardWidget } from '@nexa/ui';
import { useState } from 'react';
import { useRol } from '../../auth';
import { usePlanes } from '../api/usePlanes';
import { PlanEditPanel } from '../components/PlanEditPanel';
import { PlanesTable } from '../components/PlanesTable';

function ContenidoPlanes() {
  const consulta = usePlanes();
  const [plan, seleccionar] = useState<PlanResponse | null>(null);
  const detail = isApiError(consulta.error) ? consulta.error.detail : null;

  return (
    <div className="grid min-w-0 gap-sp-24 min-[1280px]:grid-cols-[minmax(0,1fr)_320px]">
      <section aria-label="Listado de planes" className="min-w-0">
        {consulta.isPending ? (
          <div
            role="status"
            aria-label="Cargando planes"
            className="rounded-input border border-border-hairline"
          >
            {[1, 2, 3].map((fila) => (
              <div
                key={fila}
                className="flex h-[52px] items-center border-b border-border-hairline p-sp-12"
              >
                <div className="h-4 w-full rounded-input bg-surface-subtle" />
              </div>
            ))}
          </div>
        ) : consulta.isError ? (
          <AlertaError>No se pudieron cargar los planes.{detail ? ` ${detail}` : null}</AlertaError>
        ) : consulta.data.length === 0 ? (
          <p>No hay planes activos.</p>
        ) : (
          <PlanesTable
            planes={consulta.data}
            idSeleccionado={plan?.id ?? null}
            onSeleccionar={(id) =>
              seleccionar(consulta.data.find((item) => item.id === id) ?? null)
            }
          />
        )}
      </section>
      <aside
        aria-label="Edición de plan"
        className="min-[1280px]:border-l min-[1280px]:border-border-hairline"
      >
        {plan ? (
          <PlanEditPanel key={plan.id} id={plan.id} codigo={plan.codigo} />
        ) : (
          <CardWidget title="Editar plan">
            <p>Seleccioná un plan para editarlo.</p>
          </CardWidget>
        )}
      </aside>
    </div>
  );
}

export function PlanesPage() {
  const rol = useRol();
  if (rol !== 'Administrador') {
    return <p className="p-sp-24 text-text-primary">No tenés permiso para esta acción.</p>;
  }
  return <ContenidoPlanes />;
}
