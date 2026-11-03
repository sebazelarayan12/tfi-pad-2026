import { TEXTO_SIN_DATO } from './constantes';

/** Removes display separators before sending a DNI; validation belongs to the feature schema. */
export function quitarFormatoDni(valor: string): string {
  return valor.trim().replace(/[.\s]/g, '');
}

/** Groups eight-digit DNIs; preserves unexpected input so the received data remains visible. */
export function formatearDni(valor: string | null | undefined): string {
  if (valor == null) return TEXTO_SIN_DATO;

  const dni = quitarFormatoDni(valor);
  return /^\d{8}$/.test(dni) ? `${dni.slice(0, 2)}.${dni.slice(2, 5)}.${dni.slice(5)}` : valor;
}
