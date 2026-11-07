import { ButtonLink } from '@nexa/ui';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { Link } from 'react-router-dom';

import { FormularioAltaCliente } from '../components/FormularioAltaCliente';

/** `/clientes/nuevo`: el título "Nuevo cliente" lo pone el encabezado de la ruta. */
export function AltaClientePage() {
  return (
    <section aria-label="Alta de cliente" className="flex min-w-0 flex-col gap-sp-24">
      <div>
        <ButtonLink
          label="Clientes"
          href="/clientes"
          variant="ghost"
          size="s"
          icon={<ArrowLeftIcon size={16} />}
          renderLink={({ href, ...props }) => <Link to={href} {...props} />}
        />
      </div>
      <FormularioAltaCliente />
    </section>
  );
}
