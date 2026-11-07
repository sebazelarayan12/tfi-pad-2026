import type { RouteObject } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ButtonLink } from '@nexa/ui';
import { UserPlusIcon } from '@phosphor-icons/react/dist/csr/UserPlus';
import { AltaClientePage } from './pages/AltaClientePage';
import { ClientesPage } from './pages/ClientesPage';
import { DestinoClientePendiente } from './pages/DestinoClientePendiente';

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
  // B-07 reemplaza este estado cuando integra la ficha.
  {
    path: '/clientes/:clienteId',
    element: <DestinoClientePendiente mensaje="La ficha de cliente todavía no está disponible." />,
    handle: { titulo: 'Ficha de cliente', tituloPrincipal: true, ocultarBuscador: true },
  },
];
