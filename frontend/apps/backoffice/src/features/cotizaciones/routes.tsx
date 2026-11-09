import { ButtonLink } from '@nexa/ui';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';
import type { RouteObject } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { CotizacionesPage } from './pages/CotizacionesPage';
import { NuevaCotizacionPage } from './pages/NuevaCotizacionPage';

export const rutas: RouteObject[] = [
  {
    path: '/cotizaciones',
    element: <CotizacionesPage />,
    handle: {
      titulo: 'Cotizaciones',
      tituloPrincipal: true,
      ocultarBuscador: true,
      accion: (
        <ButtonLink
          label="Nueva cotización"
          href="/cotizaciones/nueva"
          icon={<PlusIcon size={16} />}
          renderLink={({ href, ...props }) => <Link to={href} {...props} />}
        />
      ),
    },
  },
  {
    path: '/cotizaciones/nueva',
    element: <NuevaCotizacionPage />,
    handle: { titulo: 'Nueva cotización', tituloPrincipal: true, ocultarBuscador: true },
  },
];
