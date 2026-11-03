import { TEXTO_SIN_DATO } from './constantes';

const formatoImporte = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const patronImporte = /^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/;

/** Displays the backend amount as ARS without recalculating totals or rounding first (FC9). */
export function formatearImporte(valor: number | null | undefined): string {
  return typeof valor === 'number' && Number.isFinite(valor)
    ? formatoImporte.format(valor)
    : TEXTO_SIN_DATO;
}

/** Normalizes an es-AR amount for a request (RV-26); invalid or empty input returns null. */
export function parseImporteEsAR(valor: string | null | undefined): number | null {
  if (valor == null) return null;

  // Also accepts our currency formatter output, including its non-breaking space.
  const texto = valor.trim().replace(/^(-?)\$\s*/, '$1');
  if (!patronImporte.test(texto)) return null;

  const importe = Number(texto.replaceAll('.', '').replace(',', '.'));
  return Number.isFinite(importe) ? importe : null;
}
