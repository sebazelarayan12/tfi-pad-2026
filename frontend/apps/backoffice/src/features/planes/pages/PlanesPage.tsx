import { isApiError, type PlanResponse } from '@nexa/api';
import { AlertaError, Button, CardWidget, toast } from '@nexa/ui';
import { useState } from 'react';
import { useRol } from '../../auth';
import { usePlanes } from '../api/usePlanes';
import { useActivarPlan } from '../api/useActivarPlan';
import { usePlanesInactivos } from '../api/usePlanesInactivos';
import { ConfirmarDesactivarDialog } from '../components/ConfirmarDesactivarDialog';
import { FiltroInactivos } from '../components/FiltroInactivos';
import { PlanInactivoBadge } from '../components/PlanInactivoBadge';
import { TogglePlan } from '../components/TogglePlan';
import { FILTRO_INACTIVOS_DISPONIBLE, MOSTRAR_REACTIVAR } from '../config';
import { PlanCreatePanel, PlanEditPanel } from '../components/PlanEditPanel';
import { PlanesTable } from '../components/PlanesTable';

function ListadoPlanes({
  consulta,
  mostrar,
  onMostrar,
  idSeleccionado,
  renderEstado,
  onSeleccionar,
}: {
  consulta: ReturnType<typeof usePlanes>;
  mostrar: boolean;
  onMostrar: (mostrar: boolean) => void;
  idSeleccionado: string | null;
  renderEstado: (plan: PlanResponse) => React.ReactNode;
  onSeleccionar: (plan: PlanResponse) => void;
}) {
  const detail = isApiError(consulta.error) ? consulta.error.detail : null;
  return (
    <section aria-label="Listado de planes" className="min-w-0">
      {FILTRO_INACTIVOS_DISPONIBLE ? (
        <FiltroInactivos mostrar={mostrar} onCambiar={onMostrar} />
      ) : null}
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
        <p>{mostrar ? 'No hay planes para mostrar.' : 'No hay planes activos.'}</p>
      ) : (
        <PlanesTable
          planes={consulta.data}
          idSeleccionado={idSeleccionado}
          renderEstado={renderEstado}
          onSeleccionar={(id) => {
            const item = consulta.data.find((plan) => plan.id === id);
            if (item) onSeleccionar(item);
          }}
        />
      )}
    </section>
  );
}

function ContenidoPlanes() {
  const activos = usePlanes();
  const [mostrar, setMostrar] = useState(false);
  const [crear, setCrear] = useState(false);
  const [porDesactivar, setPorDesactivar] = useState<PlanResponse | null>(null);
  const inactivos = usePlanesInactivos(mostrar);
  const reactivar = useActivarPlan();
  const consulta = mostrar && FILTRO_INACTIVOS_DISPONIBLE ? inactivos : activos;
  const [plan, seleccionar] = useState<PlanResponse | null>(null);

  function renderEstado(item: PlanResponse) {
    if (item.activo) {
      return <TogglePlan activo onClick={() => setPorDesactivar(item)} />;
    }
    if (!MOSTRAR_REACTIVAR) return <PlanInactivoBadge />;
    return (
      <TogglePlan
        activo={false}
        disabled={reactivar.isPending}
        onClick={() =>
          reactivar.mutate(item.id, {
            onError: () => toast.error('No se pudo reactivar el plan.'),
          })
        }
      />
    );
  }

  return (
    <>
      <div className="mb-sp-16 flex justify-end">
        <Button
          label="Nuevo plan"
          icon={<span aria-hidden="true">+</span>}
          onClick={() => {
            seleccionar(null);
            setCrear(true);
          }}
        />
      </div>
      <div className="grid min-w-0 gap-sp-24 min-[1280px]:grid-cols-[minmax(0,1fr)_320px]">
        <ListadoPlanes
          consulta={consulta}
          mostrar={mostrar}
          onMostrar={setMostrar}
          idSeleccionado={plan?.id ?? null}
          renderEstado={renderEstado}
          onSeleccionar={(item) => {
            setCrear(false);
            seleccionar(item);
          }}
        />
        <aside
          aria-label="Edición de plan"
          className="min-[1280px]:border-l min-[1280px]:border-border-hairline"
        >
          {crear ? (
            <PlanCreatePanel
              onCancelar={() => setCrear(false)}
              onCreado={(nuevo) => {
                seleccionar(nuevo);
                setCrear(false);
              }}
            />
          ) : plan ? (
            <PlanEditPanel
              key={plan.id}
              id={plan.id}
              codigo={plan.codigo}
              estado={renderEstado(consulta.data?.find((item) => item.id === plan.id) ?? plan)}
            />
          ) : (
            <CardWidget title="Editar plan">
              <p>Seleccioná un plan para editarlo.</p>
            </CardWidget>
          )}
        </aside>
        {porDesactivar ? (
          <ConfirmarDesactivarDialog
            plan={porDesactivar}
            onCancelar={() => setPorDesactivar(null)}
            onDesactivado={(id) => {
              seleccionar((actual) => (actual?.id === id ? null : actual));
              setPorDesactivar(null);
            }}
          />
        ) : null}
      </div>
    </>
  );
}

export function PlanesPage() {
  const rol = useRol();
  if (rol !== 'Administrador') {
    return <p className="p-sp-24 text-text-primary">No tenés permiso para esta acción.</p>;
  }
  return <ContenidoPlanes />;
}
