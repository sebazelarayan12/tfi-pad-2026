import type { RouteObject } from 'react-router-dom';

import { GruposPage } from './pages/GruposPage';

export const gruposRoutes: RouteObject[] = [
  {
    path: '/grupos',
    element: <GruposPage />,
    handle: { titulo: 'Grupos externos', ocultarBuscador: true },
  },
];

export { gruposRoutes as rutas };
