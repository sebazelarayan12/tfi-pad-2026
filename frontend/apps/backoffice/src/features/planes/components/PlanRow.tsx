import { formatearImporte, type PlanResponse } from '@nexa/api';
import { TiposPermitidosTags } from './TiposPermitidosTags';

export function PlanRow({
  plan,
  seleccionado,
  onSeleccionar,
  estado,
}: {
  plan: PlanResponse;
  seleccionado: boolean;
  onSeleccionar: (id: string) => void;
  estado: React.ReactNode;
}) {
  const celda = 'border-b border-border-hairline px-sp-8 py-sp-8';
  return (
    <tr
      aria-current={seleccionado ? 'true' : undefined}
      className={`relative h-[52px] ${seleccionado ? 'bg-accent-lime-soft' : 'bg-surface-panel hover:bg-surface-subtle'}`}
    >
      <td className={`${celda} font-mono`}>{plan.codigo}</td>
      <td className={`${celda} break-words`}>{plan.nombre}</td>
      <td className={`${celda} tabular-nums`}>{formatearImporte(plan.primaBase)}</td>
      <td className={celda}>
        <TiposPermitidosTags tipos={plan.tiposPermitidos} />
      </td>
      <td className={celda}>
        {plan.antiguedadMaxima === null ? 'Sin límite' : `${plan.antiguedadMaxima} años`}
      </td>
      <td className={celda}>{estado}</td>
      <td className={celda}>
        <button
          type="button"
          aria-label={`Editar plan ${plan.codigo}`}
          onClick={() => onSeleccionar(plan.id)}
          className="absolute inset-0 flex w-full items-center justify-end pr-sp-8 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary"
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 16v4h4L20 8l-4-4L4 16Z M14 6l4 4" />
          </svg>
        </button>
      </td>
    </tr>
  );
}
