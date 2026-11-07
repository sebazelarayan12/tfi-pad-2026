import type { RouteObject } from 'react-router-dom';

import { PolizaDetallePage } from './pages/PolizaDetallePage';
import { PolizasListadoPage } from './pages/PolizasListadoPage';

// FC14: las rutas estáticas van antes que las dinámicas.
// B-12 agrega `/polizas/nueva` antes de `/polizas/:id`, en ese orden.
export const rutas: RouteObject[] = [
  { path: '/polizas', element: <PolizasListadoPage />, handle: { titulo: 'Pólizas' } },
  {
    path: '/polizas/:id',
    element: <PolizaDetallePage />,
    handle: { titulo: 'Detalle de póliza', ocultarBuscador: true },
  },
];
