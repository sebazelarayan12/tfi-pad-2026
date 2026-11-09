import type { RouteObject } from 'react-router-dom';
import { PagoFacilPage } from './pages/PagoFacilPage';

export const pagoFacilRoutes: RouteObject[] = [
  {
    path: '/pago-facil',
    element: <PagoFacilPage />,
    handle: { titulo: 'Pago Fácil', ocultarBuscador: true },
  },
];

export { pagoFacilRoutes as rutas };
