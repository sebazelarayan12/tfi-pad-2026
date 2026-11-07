import { ZONA_ARGENTINA } from '@nexa/api';

const formatoFechaArgentina = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_ARGENTINA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Fecha civil de hoy en Argentina (no la del navegador). */
export function hoyArgentina(ahora: Date = new Date()): { anio: number; mes: number; dia: number } {
  const partes = formatoFechaArgentina.formatToParts(ahora);
  const leer = (tipo: string) => Number(partes.find((parte) => parte.type === tipo)?.value);
  return { anio: leer('year'), mes: leer('month'), dia: leer('day') };
}

const patronFecha = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** `dd/mm/aaaa` a partes, o `null` si no es una fecha real del calendario. */
export function leerFecha(texto: string): { anio: number; mes: number; dia: number } | null {
  const coincide = patronFecha.exec(texto.trim());
  if (!coincide) return null;
  const dia = Number(coincide[1]);
  const mes = Number(coincide[2]);
  const anio = Number(coincide[3]);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    anio < 1900 ||
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    return null;
  }
  return { anio, mes, dia };
}

/** Años cumplidos a la fecha de hoy en Argentina. */
export function edadEnAnios(
  nacimiento: { anio: number; mes: number; dia: number },
  ahora: Date = new Date(),
): number {
  const hoy = hoyArgentina(ahora);
  const cumplioEsteAnio =
    hoy.mes > nacimiento.mes || (hoy.mes === nacimiento.mes && hoy.dia >= nacimiento.dia);
  return hoy.anio - nacimiento.anio - (cumplioEsteAnio ? 0 : 1);
}

/** `dd/mm/aaaa` a `yyyy-MM-dd`. Solo para fechas ya validadas. */
export function aFechaIso(texto: string): string {
  const [dia, mes, anio] = texto.trim().split('/');
  return `${anio}-${mes}-${dia}`;
}

/** `yyyy-MM-dd` (input type="date") a `dd/mm/aaaa`. */
export function deFechaIso(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Fecha máxima para el calendario: hoy menos 18 años, en `yyyy-MM-dd`. */
export function fechaMaximaNacimiento(ahora: Date = new Date()): string {
  const hoy = hoyArgentina(ahora);
  const anio = String(hoy.anio - 18).padStart(4, '0');
  // El 29/02 no existe 18 años atrás si ese año no es bisiesto: se usa el 28.
  const bisiesto =
    (hoy.anio - 18) % 4 === 0 && ((hoy.anio - 18) % 100 !== 0 || (hoy.anio - 18) % 400 === 0);
  const dia = hoy.mes === 2 && hoy.dia === 29 && !bisiesto ? 28 : hoy.dia;
  return `${anio}-${String(hoy.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** Escribe la fecha con las barras puestas: `14022010` queda `14/02/2010`. */
export function enmascararFecha(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

/** Máscara `XX-XXXXXXXX-X` mientras se escribe. */
export function enmascararCuil(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 10) return `${digitos.slice(0, 2)}-${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`;
}

/**
 * Teléfono argentino (D-B05-9): código de área más abonado, 10 dígitos en total. Admite el
 * `0` inicial, el `+54` y el `+54 9` de móviles, y separadores (espacios, guiones, puntos y
 * paréntesis). No admite el `15` (se escribe el código de área completo).
 */
export function esTelefonoArgentino(texto: string): boolean {
  const limpio = texto.trim().replace(/[\s().-]/g, '');
  if (!/^\+?\d+$/.test(limpio)) return false;
  let digitos = limpio;
  if (limpio.startsWith('+')) {
    if (!limpio.startsWith('+54')) return false;
    digitos = limpio.slice(3).replace(/^9/, '');
  } else if (limpio.startsWith('0')) {
    digitos = limpio.slice(1);
  }
  return /^[1-9]\d{9}$/.test(digitos);
}
