/**
 * Tipos de `/api/publico/grupos/*` y `/api/grupos/*`: alta de grupos externos que quieren
 * consumir la API de Nexa Seguros, y su clave de acceso (`docs/api-externa.md`).
 */

/** Estado de la solicitud de acceso. El back lo envía como número. */
export const ESTADO_GRUPO = {
  Pendiente: 0,
  Aprobada: 1,
  Rechazada: 2,
  Revocada: 3,
} as const;

export type EstadoGrupo = (typeof ESTADO_GRUPO)[keyof typeof ESTADO_GRUPO];

/** `POST /api/publico/grupos/registro`. */
export interface RegistroGrupoRequest {
  email: string;
  password: string;
  /** Nombre del grupo o equipo. Único. */
  nombre: string;
  contacto: string;
  /** Para qué va a usar la API. */
  descripcion: string;
}

/** `GET /api/grupos/mi-cuenta` y 201 del registro. */
export interface GrupoCuentaResponse {
  id: string;
  nombre: string;
  email: string;
  contacto: string;
  descripcion: string;
  estado: EstadoGrupo;
  /** Motivo del rechazo o de la revocación. */
  motivo: string | null;
  fechaSolicitud: string;
  fechaResolucion: string | null;
  tieneClave: boolean;
  /** Primeros caracteres de la clave, para distinguirla. Nunca la clave completa. */
  clavePrefijo: string | null;
  claveCreadaEn: string | null;
}

/** 201 de `POST /api/grupos/mi-cuenta/clave`. La clave solo viaja en esta respuesta. */
export interface ClaveGeneradaResponse {
  clave: string;
  prefijo: string;
  creadaEn: string;
}

/** Item de `GET /api/grupos` (administrador). */
export interface GrupoListItemResponse {
  id: string;
  nombre: string;
  email: string;
  contacto: string;
  descripcion: string;
  estado: EstadoGrupo;
  motivo: string | null;
  fechaSolicitud: string;
  fechaResolucion: string | null;
  tieneClave: boolean;
}

/** Body de `POST /api/grupos/{id}/rechazar` y `/revocar`. */
export interface MotivoGrupoRequest {
  motivo: string;
}

export type FiltroGrupos = {
  estado?: EstadoGrupo;
  pagina?: number;
  tamano?: number;
};
