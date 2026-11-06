import { CardWidget, EstadoBadge } from '@nexa/ui';

/** Texto fijo del Figma (DN-W4-7): no depende del estado de la póliza. */
export function CicloPoliza() {
  return (
    <CardWidget title="Ciclo de la póliza">
      <div className="flex flex-col gap-sp-12">
        <div className="flex items-center gap-sp-8">
          <EstadoBadge estado="Pendiente" />
          <span aria-hidden="true">›</span>
          <EstadoBadge estado="Vigente" />
        </div>
        <p>Pasa de Pendiente a Vigente al pagarse la cuota 1.</p>
      </div>
    </CardWidget>
  );
}
