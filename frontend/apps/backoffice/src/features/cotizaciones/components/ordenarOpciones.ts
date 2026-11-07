import type { OpcionCotizacion } from '@nexa/api';

export function ordenarOpciones(opciones: readonly OpcionCotizacion[]): OpcionCotizacion[] {
  return [...opciones].sort((a, b) => a.primaMensual - b.primaMensual);
}
