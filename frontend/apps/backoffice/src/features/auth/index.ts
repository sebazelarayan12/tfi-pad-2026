export type { Sesion } from './types/sesion';
export {
  alCerrarSesion,
  cerrarSesion,
  emailSesion,
  iniciarSesion,
  sesionActual,
  useRol,
  useSesion,
} from './sesion/store';
export type { MotivoCierre } from './sesion/store';

export const RUTA_LOGIN = '/login';
