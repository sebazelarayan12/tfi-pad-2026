export type TipoBusqueda = 'numero' | 'dni' | 'patente' | 'invalido';

export interface BusquedaClasificada {
  tipo: TipoBusqueda;
  valor: string;
}

const NUMERO = /^POL-\d{7}$/;
const DNI = /^\d{7,8}$/;
const PATENTE = /^([A-Z]{2}\d{3}[A-Z]{2}|[A-Z]{3}\d{3})$/;

/**
 * Clasifica el texto del buscador. El orden importa: número, DNI y patente (ficha B-14 §6).
 * Un texto vacío no es una búsqueda: devuelve `undefined`.
 */
export function clasificarBusqueda(texto: string): BusquedaClasificada | undefined {
  const valor = texto.trim().toUpperCase();
  if (valor === '') return undefined;
  if (NUMERO.test(valor)) return { tipo: 'numero', valor };
  if (DNI.test(valor)) return { tipo: 'dni', valor };
  if (PATENTE.test(valor)) return { tipo: 'patente', valor };
  return { tipo: 'invalido', valor };
}
