import type { RouteObject } from 'react-router-dom';
import { PlanesPage } from './pages/PlanesPage';

export const planesRoutes: RouteObject[] = [
  { path: '/planes', element: <PlanesPage />, handle: { titulo: 'Planes', ocultarBuscador: true } },
];

export { planesRoutes as rutas };
