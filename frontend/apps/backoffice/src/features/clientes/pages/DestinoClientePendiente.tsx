import { ButtonLink } from '@nexa/ui';
import { Link } from 'react-router-dom';

export function DestinoClientePendiente({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex flex-col items-start gap-sp-16 rounded-card border border-border-hairline bg-surface-panel p-sp-24">
      <p className="text-body-sm text-text-secondary">{mensaje}</p>
      <ButtonLink
        label="Volver al listado"
        href="/clientes"
        variant="secondary"
        renderLink={({ href, ...props }) => <Link to={href} replace {...props} />}
      />
    </div>
  );
}
