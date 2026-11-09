import type { RouteObject } from 'react-router-dom';
import { NuevoVehiculoPage } from './pages/NuevoVehiculoPage';

export const rutas: RouteObject[] = [
  {
    path: '/clientes/:clienteId/vehiculos/nuevo',
    element: <NuevoVehiculoPage />,
    handle: { titulo: 'Nuevo vehículo', tituloPrincipal: true, ocultarBuscador: true },
  },
];
