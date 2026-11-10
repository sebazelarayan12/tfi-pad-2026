export type { Sesion } from './types/sesion';
export { CampoContrasena } from './components/CampoContrasena';
export { LayoutAcceso } from './components/LayoutAcceso';
export {
  alCerrarSesion,
  cerrarSesion,
  emailSesion,
  exigirCambioPassword,
  iniciarSesion,
  sesionActual,
  useRol,
  useSesion,
} from './sesion/store';
export type { MotivoCierre } from './sesion/store';

export const RUTA_LOGIN = '/login';
export const RUTA_CAMBIAR_PASSWORD = '/cambiar-password';
