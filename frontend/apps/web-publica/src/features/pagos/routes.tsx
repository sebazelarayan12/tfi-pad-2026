import type { RouteObject } from 'react-router-dom';

import { MedioDePagoPage } from './pages/MedioDePagoPage';

/** Rutas del feature `pagos` de la web: W4 (W-06). W-08 agrega `/pago/exito`. */
export const rutas: RouteObject[] = [
  { path: '/poliza/pagar/medio-de-pago', element: <MedioDePagoPage /> },
];
