import type { RouteObject } from 'react-router-dom';

import { ConsultarPolizaPage } from './pages/ConsultarPolizaPage';
import { PolizaPublicaPage } from './pages/PolizaPublicaPage';

/** Rutas del feature `polizas` de la web: consulta (W2) y "Mi póliza" (W3). */
export const rutas: RouteObject[] = [
  { path: '/consultar-poliza', element: <ConsultarPolizaPage /> },
  { path: '/poliza', element: <PolizaPublicaPage /> },
];
