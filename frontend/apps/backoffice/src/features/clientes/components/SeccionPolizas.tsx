import type { PaginaResponse, PolizaListItemResponse, VehiculoResponse } from '@nexa/api';
import { AlertaError, Button } from '@nexa/ui';

import { TAMANO_POLIZAS } from '../api/usePolizasDelCliente';
import type { ProximoVencimiento } from '../api/useProximasCuotas';
import { PolizasClienteTabla } from './PolizasClienteTabla';

interface SeccionPolizasProps {
  pagina: PaginaResponse<PolizaListItemResponse> | undefined;
  cargando: boolean;
  hayError: boolean;
  onReintentar: () => void;
  vehiculos: readonly VehiculoResponse[];
  proximos: ReadonlyMap<string, ProximoVencimiento>;
}

/** Pólizas del cliente, apiladas bajo los vehículos (D-17). */
export function SeccionPolizas({
  pagina,
  cargando,
  hayError,
  onReintentar,
  vehiculos,
  proximos,
}: SeccionPolizasProps) {
  const polizas = pagina?.items ?? [];
  return (
    <section
      aria-label="Pólizas del cliente"
      aria-busy={cargando}
      className="flex flex-col gap-sp-16 pt-sp-32"
    >
      <h2 className="text-h3 text-text-primary">Pólizas</h2>
      {hayError ? (
        <div className="flex flex-col items-start gap-sp-12">
          <AlertaError>No pudimos cargar las pólizas.</AlertaError>
          <Button label="Reintentar" variant="secondary" onClick={onReintentar} />
        </div>
      ) : null}
      {cargando ? (
        <div
          aria-hidden="true"
          className="h-24 rounded-card bg-surface-subtle motion-safe:animate-pulse"
        />
      ) : null}
      {pagina && polizas.length > 0 ? (
        <PolizasClienteTabla polizas={polizas} vehiculos={vehiculos} proximos={proximos} />
      ) : null}
      {pagina && polizas.length === 0 ? (
        <p className="text-body-sm text-text-secondary">Este cliente no tiene pólizas.</p>
      ) : null}
      {pagina && pagina.total > TAMANO_POLIZAS ? (
        <p className="text-body-sm text-text-secondary">
          Mostrando las primeras {TAMANO_POLIZAS} pólizas.
        </p>
      ) : null}
    </section>
  );
}
