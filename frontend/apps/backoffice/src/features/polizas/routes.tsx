import type { RouteObject } from 'react-router-dom';

import { EmitirPolizaPage } from './pages/EmitirPolizaPage';
import { PolizaDetallePage } from './pages/PolizaDetallePage';
import { PolizasListadoPage } from './pages/PolizasListadoPage';

// FC14: las rutas estáticas van antes que las dinámicas.
export const rutas: RouteObject[] = [
  { path: '/polizas', element: <PolizasListadoPage />, handle: { titulo: 'Pólizas' } },
  {
    path: '/polizas/nueva',
    element: <EmitirPolizaPage />,
    handle: { titulo: 'Emitir póliza', tituloPrincipal: true, ocultarBuscador: true },
  },
  {
    path: '/polizas/:id',
    element: <PolizaDetallePage />,
    handle: { titulo: 'Detalle de póliza', ocultarBuscador: true },
  },
];
