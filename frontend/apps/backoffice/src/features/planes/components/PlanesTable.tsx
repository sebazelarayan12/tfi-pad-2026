import type { PlanResponse } from '@nexa/api';
import { PlanRow } from './PlanRow';

const columnas = [
  ['Código', 60],
  ['Nombre', 229],
  ['Prima base', 104],
  ['Tipos permitidos', 216],
  ['Antigüedad máxima', 88],
  ['Activo', 60],
  ['Acción', 32],
] as const;
const anchoTotal = columnas.reduce((total, [, ancho]) => total + ancho, 0);

export function PlanesTable({
  planes,
  idSeleccionado,
  onSeleccionar,
  renderEstado,
}: {
  planes: PlanResponse[];
  idSeleccionado: string | null;
  onSeleccionar: (id: string) => void;
  renderEstado: (plan: PlanResponse) => React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-input border border-border-hairline">
      <table className="w-full table-fixed border-separate border-spacing-0 text-left text-body-sm text-text-primary">
        <caption className="sr-only">Planes activos</caption>
        <thead className="bg-surface-subtle text-label text-text-secondary">
          <tr>
            {columnas.map(([nombre, ancho]) => (
              <th
                key={nombre}
                scope="col"
                style={{ width: `${(ancho / anchoTotal) * 100}%` }}
                className="h-[52px] px-sp-8"
              >
                {nombre === 'Acción' ? <span className="sr-only">{nombre}</span> : nombre}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {planes.map((plan) => (
            <PlanRow
              key={plan.id}
              plan={plan}
              seleccionado={plan.id === idSeleccionado}
              onSeleccionar={onSeleccionar}
              estado={renderEstado(plan)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
