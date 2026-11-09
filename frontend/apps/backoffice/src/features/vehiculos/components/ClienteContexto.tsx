import { formatearDni, type ClienteResponse } from '@nexa/api';
import { ButtonLink } from '@nexa/ui';
import { Link } from 'react-router-dom';

export function ClienteContexto({ cliente }: { cliente?: ClienteResponse | undefined }) {
  if (!cliente) {
    return (
      <div role="status">
        <span className="sr-only">Cargando datos del cliente…</span>
        <div
          aria-hidden="true"
          className="h-4 w-full max-w-72 rounded-input bg-surface-subtle motion-safe:animate-pulse"
        />
      </div>
    );
  }
  return (
    <p className="text-body-sm text-text-secondary">
      Cliente: {cliente.nombre} {cliente.apellido}, DNI{' '}
      <span className="font-mono">{formatearDni(cliente.dni)}</span>
    </p>
  );
}

export function ClienteNoEncontrado() {
  return (
    <div className="flex flex-col items-start gap-sp-16 rounded-card border border-border-hairline bg-surface-panel p-sp-24">
      <h2 className="text-h2 text-text-primary">Cliente no encontrado</h2>
      <ButtonLink
        label="Ir a clientes"
        href="/clientes"
        variant="secondary"
        renderLink={({ href, ...props }) => <Link to={href} {...props} />}
      />
    </div>
  );
}
