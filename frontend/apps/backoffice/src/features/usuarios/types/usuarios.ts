import type { RolUsuario } from '@nexa/api';

/** Valores del formulario: el rol arranca sin elegir (D-20). */
export interface NuevoEmpleadoValues {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: RolUsuario | undefined;
}

export type CampoUsuario = 'nombre' | 'apellido' | 'email' | 'password' | 'rol';
