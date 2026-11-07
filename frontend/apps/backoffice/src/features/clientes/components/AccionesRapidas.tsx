import { ButtonLink, CardWidget } from '@nexa/ui';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';
import { Link } from 'react-router-dom';

/**
 * Rail de la ficha (D-B07-3): solo "Agregar vehículo". "Nueva cotización" y "Registrar pago en
 * caja" esperan decisión, y el bloque Cuenta queda oculto hasta que el back publique la deuda.
 */
export function AccionesRapidas({ clienteId }: { clienteId: string }) {
  return (
    <CardWidget title="Acciones">
      <ButtonLink
        label="Agregar vehículo"
        href={`/clientes/${encodeURIComponent(clienteId)}/vehiculos/nuevo`}
        variant="secondary"
        icon={<PlusIcon size={16} />}
        renderLink={({ href, ...props }) => <Link to={href} {...props} />}
      />
    </CardWidget>
  );
}
