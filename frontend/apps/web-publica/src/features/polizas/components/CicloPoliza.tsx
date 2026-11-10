import { CardWidget, EstadoBadge } from '@nexa/ui';
import { CaretRightIcon } from '@phosphor-icons/react/dist/csr/CaretRight';

/** Texto fijo del Figma (DN-W4-7): no depende del estado de la póliza. */
export function CicloPoliza() {
  return (
    <CardWidget title="Ciclo de la póliza">
      <div className="flex flex-col gap-sp-12">
        <div className="flex items-center gap-sp-8">
          <EstadoBadge estado="Pendiente" />
          <CaretRightIcon aria-hidden="true" size={16} className="text-text-tertiary" />
          <EstadoBadge estado="Vigente" />
        </div>
        <p className="text-body-sm text-text-secondary">
          Pasa de Pendiente a Vigente al pagarse la cuota 1.
        </p>
      </div>
    </CardWidget>
  );
}
