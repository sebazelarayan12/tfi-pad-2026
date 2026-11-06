import type { RouteObject } from 'react-router-dom';

/** B-17 no tiene ruta propia; B-19 agrega `/pagos`. */
export const pagosRoutes: RouteObject[] = [];

// Compatibilidad con el scaffold de T-14, que compone `rutas` de cada feature.
export const rutas = pagosRoutes;
