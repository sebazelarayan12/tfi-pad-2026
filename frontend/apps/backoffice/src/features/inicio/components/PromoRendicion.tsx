import { Link } from 'react-router-dom';
import { useRendicionPendienteHoy } from '../api/useRendicionPendienteHoy';

export function PromoRendicion() {
  const mostrar = useRendicionPendienteHoy();
  if (!mostrar) return null;

  return (
    <section className="flex flex-col items-start gap-sp-12 rounded-card bg-accent-promo p-sp-16 text-text-primary">
      <h3 className="text-h3">Rendición de Pago Fácil disponible</h3>
      <p className="text-body-sm">
        Subí el archivo .txt del día para registrar los pagos en efectivo.
      </p>
      <Link
        to="/pago-facil"
        className="inline-flex h-8 items-center rounded-pill border border-border-strong bg-surface-panel px-sp-12 text-label focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      >
        Ir a rendición
      </Link>
    </section>
  );
}
