// API pública del feature `polizas` de la web (FB3 regla 1): sólo esto se importa desde afuera.
export { rutas as polizasRoutes } from './routes';
export { AlertaEstadoConsulta } from './components/AlertaEstadoConsulta';
export type { TonoAlertaEstadoConsulta } from './components/AlertaEstadoConsulta';
export { leerEstadoNavegacion } from './schemas/navegacion';
export type { EstadoMiPoliza, EstadoNavegacion, EstadoPagoPublico } from './types/navegacion';
