import type { RouteObject } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ButtonLink } from '@nexa/ui';
import { UserPlusIcon } from '@phosphor-icons/react/dist/csr/UserPlus';
import { AltaClientePage } from './pages/AltaClientePage';
import { ClientesPage } from './pages/ClientesPage';
import { FichaClientePage } from './pages/FichaClientePage';

export const rutas: RouteObject[] = [
  {
    path: '/clientes',
    element: <ClientesPage />,
    handle: {
      titulo: 'Clientes',
      tituloPrincipal: true,
      ocultarBuscador: true,
      accion: (
        <ButtonLink
          label="Nuevo cliente"
          href="/clientes/nuevo"
          icon={<UserPlusIcon size={16} />}
          renderLink={({ href, ...props }) => <Link to={href} {...props} />}
        />
      ),
    },
  },
  {
    path: '/clientes/nuevo',
    element: <AltaClientePage />,
    handle: { titulo: 'Nuevo cliente', tituloPrincipal: true, ocultarBuscador: true },
  },
  // Dinámica después de las estáticas (FC14). El H1 de la página es el nombre del cliente.
  {
    path: '/clientes/:clienteId',
    element: <FichaClientePage />,
    handle: { titulo: 'Ficha de cliente', ocultarBuscador: true },
  },
];
