import { ButtonLink } from '@nexa/ui';
import type { RouteObject } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { InicioPage } from './pages/InicioPage';

export const inicioRoutes: RouteObject[] = [
  {
    path: '/inicio',
    element: <InicioPage />,
    handle: {
      titulo: 'Inicio',
      accion: (
        <ButtonLink
          label="Nueva cotización"
          href="/cotizaciones/nueva"
          renderLink={({ href, ...props }) => <Link to={href} {...props} />}
        />
      ),
    },
  },
];

export { inicioRoutes as rutas };
