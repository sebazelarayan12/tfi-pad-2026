import type { RouteObject } from 'react-router-dom';

import { UsuariosPage } from './pages/UsuariosPage';

export const usuariosRoutes: RouteObject[] = [
  {
    path: '/usuarios',
    element: <UsuariosPage />,
    handle: { titulo: 'Usuarios', ocultarBuscador: true },
  },
];

export { usuariosRoutes as rutas };
