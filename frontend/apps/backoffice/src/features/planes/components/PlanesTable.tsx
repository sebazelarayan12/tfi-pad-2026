import type { PlanResponse } from '@nexa/api';
import { PlanRow } from './PlanRow';

const columnas = [
  ['Código', 60],
  ['Nombre', 229],
  ['Prima base', 104],
  ['Tipos permitidos', 216],
  ['Antigüedad máxima', 88],
  ['Acción', 32],
] as const;

export function PlanesTable({
  planes,
  idSeleccionado,
  onSeleccionar,
}: {
  planes: PlanResponse[];
  idSeleccionado: string | null;
  onSeleccionar: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-input border border-border-hairline">
      <table className="w-full min-w-[729px] table-fixed border-separate border-spacing-0 text-left text-body-sm text-text-primary">
        <caption className="sr-only">Planes activos</caption>
        <thead className="bg-surface-subtle text-label text-text-secondary">
          <tr>
            {columnas.map(([nombre, ancho]) => (
              <th key={nombre} scope="col" style={{ width: ancho }} className="h-[52px] px-sp-8">
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
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
