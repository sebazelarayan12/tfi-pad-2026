import type { RolUsuario } from './auth';

export interface CrearUsuarioRequest {
  email: string;
  password: string;
  rol: RolUsuario;
  nombre: string;
  apellido: string;
}

export interface UsuarioResponse {
  id: string;
  email: string;
  rol: RolUsuario;
}

/** MOCK (PB-04). */
export interface YoResponseMock extends UsuarioResponse {
  nombre: string;
  apellido: string;
}

/** MOCK (PB-04). */
export interface UsuarioListItemMock extends YoResponseMock {
  activo: boolean;
  ultimoIngreso: string | null;
}

/** MOCK (PB-04). */
export type ActualizarUsuarioMock = Pick<YoResponseMock, 'nombre' | 'apellido' | 'rol'>;
