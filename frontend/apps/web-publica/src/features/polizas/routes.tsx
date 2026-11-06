import type { RouteObject } from 'react-router-dom';

import { ConsultarPolizaPage } from './pages/ConsultarPolizaPage';

/**
 * Rutas del feature `polizas` de la web. `/poliza` queda como stub sin elemento hasta que
 * US-FE-W-04 implemente la pantalla; así el `navigate` de W2 ya tiene destino.
 */
export const rutas: RouteObject[] = [
  { path: '/consultar-poliza', element: <ConsultarPolizaPage /> },
  { path: '/poliza' },
];
