import type { RouteObject } from 'react-router-dom';
import { InicioPage } from './pages/InicioPage';

export const inicioRoutes: RouteObject[] = [
  { path: '/inicio', element: <InicioPage />, handle: { titulo: 'Inicio' } },
];

export { inicioRoutes as rutas };
