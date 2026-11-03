import { TEXTO_SIN_DATO, ZONA_ARGENTINA } from './constantes';

const patronFechaCalendario = /^\d{4}-\d{2}-\d{2}$/;
const patronZona = /(?:Z|[+-]\d{2}:?\d{2})$/;
const patronFraccionLarga = /\.(\d{3})\d+/;
const formatoFechaHora = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA_ARGENTINA,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Displays DateOnly without a time-zone conversion that could change the business day (FB7.4). */
export function formatearFechaCalendario(valor: string | null | undefined): string {
  if (valor == null || !patronFechaCalendario.test(valor)) return TEXTO_SIN_DATO;

  const anio = Number(valor.slice(0, 4));
  const mes = Number(valor.slice(5, 7));
  const dia = Number(valor.slice(8, 10));
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  // Date.UTC maps years 0..99 to 1900..1999; preserve valid early DateOnly years.
  if (anio < 100) fecha.setUTCFullYear(anio, mes - 1, dia);
  if (
    anio < 1 ||
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    return TEXTO_SIN_DATO;
  }

  return `${valor.slice(8, 10)}/${valor.slice(5, 7)}/${valor.slice(0, 4)}`;
}

/** Treats offset-free backend DateTime values as UTC and trims .NET tick precision (PB-16). */
export function parsearFechaUtc(valor: string | null | undefined): Date | null {
  if (valor == null || valor.trim() === '') return null;

  const texto = patronZona.test(valor) ? valor : `${valor}Z`;
  const instante = Date.parse(texto.replace(patronFraccionLarga, '.$1'));
  return Number.isNaN(instante) ? null : new Date(instante);
}

/** Displays UTC timestamps in Argentina as dd/mm/yyyy HH:mm, regardless of the host locale. */
export function formatearFechaHora(valor: string | null | undefined): string {
  const fecha = parsearFechaUtc(valor);
  if (fecha === null) return TEXTO_SIN_DATO;

  const partes = formatoFechaHora.formatToParts(fecha);
  const parte = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((elemento) => elemento.type === tipo)?.value;
  return `${parte('day')}/${parte('month')}/${parte('year')} ${parte('hour')}:${parte('minute')}`;
}
