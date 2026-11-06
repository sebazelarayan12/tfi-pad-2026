import { BarcodeIcon } from '@phosphor-icons/react/dist/csr/Barcode';
import { CreditCardIcon } from '@phosphor-icons/react/dist/csr/CreditCard';
import { CardWidget } from '@nexa/ui';

import { renderLinkRouter } from '../../../shared/enlace/renderLinkRouter';
import { RUTA_CONSULTAR_POLIZA } from '../destinos';

// Textos literales de W1 §5 (ficha W-01 §8).
const TITULO = 'Cómo pagar';
const ONLINE_TITULO = 'Pago online';
const ONLINE_TEXTO = 'Elegí Pasarela A o Pasarela B y pagá con tarjeta o dinero en cuenta.';
const ONLINE_ACCION = 'Consultar póliza';
const EFECTIVO_TITULO = 'Efectivo con Pago Fácil';
const EFECTIVO_TEXTO =
  'Pagá en efectivo con el cupón de Pago Fácil, que tiene un código de barras de 42 dígitos.';
const TAMANO_ICONO = 20;

/**
 * Sección "Cómo pagar": dos tarjetas. La de Pago Fácil va sin acción: "Ver ejemplo de cupón"
 * no es interactivo hasta definir qué muestra (RV-D21, DN-W1-1).
 */
export function ComoPagar() {
  return (
    <section aria-labelledby="titulo-como-pagar" className="flex flex-col gap-sp-24 py-sp-48">
      <h2 id="titulo-como-pagar" className="text-h2 text-text-primary">
        {TITULO}
      </h2>
      <div className="grid grid-cols-1 gap-sp-24 md:grid-cols-2">
        <CardWidget
          title={ONLINE_TITULO}
          icon={<CreditCardIcon size={TAMANO_ICONO} weight="regular" />}
          action={{
            label: ONLINE_ACCION,
            href: RUTA_CONSULTAR_POLIZA,
            renderLink: renderLinkRouter,
          }}
        >
          {ONLINE_TEXTO}
        </CardWidget>
        <CardWidget
          title={EFECTIVO_TITULO}
          icon={<BarcodeIcon size={TAMANO_ICONO} weight="regular" />}
        >
          {EFECTIVO_TEXTO}
        </CardWidget>
      </div>
    </section>
  );
}
