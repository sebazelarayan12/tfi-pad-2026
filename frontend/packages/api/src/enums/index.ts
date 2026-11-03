import { TEXTO_SIN_DATO } from '../format/constantes';
import type { EstadoBadgeValue } from './badges';
import { tablas, type Dominio, type EntradaEnum } from './dominios';

export type { EstadoBadgeValue } from './badges';
export type {
  Dominio,
  EntradaEnum,
  EstadoCuotaNum,
  EstadoFacturaStr,
  EstadoPagoStr,
  EstadoPolizaNum,
  EstadoPublicoStr,
  MedioPagoStr,
} from './dominios';

export function obtenerEnum<D extends Dominio>(dominio: D, valor: unknown): EntradaEnum<D> | null {
  const tabla: readonly EntradaEnum<D>[] = tablas[dominio];
  return tabla.find((entrada) => entrada.valor === valor) ?? null;
}

export function etiquetaEnum(dominio: Dominio, valor: unknown): string {
  return obtenerEnum(dominio, valor)?.etiqueta ?? TEXTO_SIN_DATO;
}

export function badgeEnum(dominio: Dominio, valor: unknown): EstadoBadgeValue | null {
  return obtenerEnum(dominio, valor)?.badge ?? null;
}
