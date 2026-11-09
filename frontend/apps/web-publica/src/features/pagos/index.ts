// API pública del feature `pagos` de la web (FB3 regla 1): sólo esto se importa desde afuera.
export { rutas as pagosRoutes } from './routes';
export { leerNumeroPagoEnCurso } from './api/almacenamientoPago';
