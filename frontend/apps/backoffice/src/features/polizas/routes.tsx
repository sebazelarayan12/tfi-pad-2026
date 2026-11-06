import type { RouteObject } from 'react-router-dom';

import { PolizasListadoPage } from './pages/PolizasListadoPage';

// FC14: las rutas estáticas van antes que las dinámicas.
// B-12 agrega `/polizas/nueva` y B-15 agrega `/polizas/:id` después de esta, en ese orden.
export const rutas: RouteObject[] = [
  { path: '/polizas', element: <PolizasListadoPage />, handle: { titulo: 'Pólizas' } },
];
