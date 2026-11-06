import type { RendicionResponse } from '@nexa/api';

export type ResultadoSubida =
  | { tipo: 'ninguno' }
  | { tipo: 'ok'; resultado: RendicionResponse }
  | { tipo: 'error'; mensaje: string; lineas?: string[]; duplicado?: boolean; ayuda?: string };
