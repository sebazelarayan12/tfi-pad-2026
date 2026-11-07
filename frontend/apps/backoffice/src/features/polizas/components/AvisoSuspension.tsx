import { AVISO_SUSPENSION } from '../textosDetalle';

/** Solo visible con la póliza Suspendida (el padre decide cuándo montarlo). */
export function AvisoSuspension() {
  return (
    <p className="rounded-input border border-border-hairline bg-surface-subtle px-sp-16 py-sp-12 text-body-sm text-text-primary">
      {AVISO_SUSPENSION}
    </p>
  );
}
