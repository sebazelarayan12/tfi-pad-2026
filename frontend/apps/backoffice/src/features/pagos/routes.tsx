import type { RouteObject } from 'react-router-dom';

import { PagosPage } from './pages/PagosPage';

/** B-19: `/pagos`. El `handle.titulo` lo muestra el Topbar del layout. */
export const pagosRoutes: RouteObject[] = [
  { path: '/pagos', element: <PagosPage />, handle: { titulo: 'Pagos y facturas' } },
];

// Compatibilidad con el scaffold de T-14, que compone `rutas` de cada feature.
export const rutas = pagosRoutes;
