import type { RouteObject } from 'react-router-dom';

import { MedioDePagoPage } from './pages/MedioDePagoPage';
import { PagoAprobadoPage } from './pages/PagoAprobadoPage';

/** Rutas del feature `pagos` de la web: W4 (W-06) y el retorno de la pasarela W6 (W-08). */
export const rutas: RouteObject[] = [
  { path: '/poliza/pagar/medio-de-pago', element: <MedioDePagoPage /> },
  { path: '/pago/exito', element: <PagoAprobadoPage /> },
];
