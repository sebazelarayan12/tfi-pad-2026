import type { RouteObject } from 'react-router-dom';

import { CuponPagoFacilPage } from './pages/CuponPagoFacilPage';

/** Rutas del feature `pago-facil` de la web: W5 (W-07). */
export const rutas: RouteObject[] = [
  { path: '/poliza/pagar/pago-facil', element: <CuponPagoFacilPage /> },
];
