import type { RouteObject } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ButtonLink } from '@nexa/ui';
import { UserPlusIcon } from '@phosphor-icons/react/dist/csr/UserPlus';
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
  // B-05 y B-07 reemplazan estos estados cuando integran sus pantallas.
  {
    path: '/clientes/nuevo',
    element: <DestinoClientePendiente mensaje="El alta de clientes todavía no está disponible." />,
    handle: { titulo: 'Nuevo cliente', tituloPrincipal: true, ocultarBuscador: true },
  },
  {
    path: '/clientes/:clienteId',
    element: <DestinoClientePendiente mensaje="La ficha de cliente todavía no está disponible." />,
    handle: { titulo: 'Ficha de cliente', tituloPrincipal: true, ocultarBuscador: true },
  },
];
