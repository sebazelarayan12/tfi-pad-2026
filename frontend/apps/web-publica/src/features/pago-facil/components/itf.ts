/**
 * Interleaved 2 of 5 (ITF): codifica pares de dígitos; el primero de cada par va en las barras y el
 * segundo en los espacios. Cada dígito son 5 elementos, 2 anchos y 3 angostos. DN-W7-1 (Martin):
 * se dibuja con ITF, pendiente de validar contra la especificación de Pago Fácil.
 */

/** `true` = ancho. Tabla estándar de ITF, dígitos 0 a 9. */
const PATRONES: ReadonlyArray<ReadonlyArray<boolean>> = [
  [false, false, true, true, false],
  [true, false, false, false, true],
  [false, true, false, false, true],
  [true, true, false, false, false],
  [false, false, true, false, true],
  [true, false, true, false, false],
  [false, true, true, false, false],
  [false, false, false, true, true],
  [true, false, false, true, false],
  [false, true, false, true, false],
];

/** Relación ancho/angosto (la norma admite de 2 a 3). */
export const ANCHO_ELEMENTO_ANCHO = 3;
const ANGOSTO = 1;

/** Inicio: barra, espacio, barra, espacio, todos angostos. */
const INICIO = [ANGOSTO, ANGOSTO, ANGOSTO, ANGOSTO];
/** Fin: barra ancha, espacio angosto, barra angosta. */
const FIN = [ANCHO_ELEMENTO_ANCHO, ANGOSTO, ANGOSTO];

/** Zona en blanco a cada lado, en módulos (mínimo de la norma: 10 angostos). */
export const ZONA_SILENCIO = 10;

function ancho(esAncho: boolean | undefined): number {
  return esAncho ? ANCHO_ELEMENTO_ANCHO : ANGOSTO;
}

/** Dígitos numéricos en cantidad par: lo único que ITF puede codificar. */
export function esCodificableItf(digitos: string): boolean {
  return digitos.length > 0 && digitos.length % 2 === 0 && /^\d+$/.test(digitos);
}

/**
 * Anchos en módulos de los elementos, alternando barra y espacio y empezando por barra
 * (inicio + datos + fin, sin las zonas en blanco). Lanza si los dígitos no son codificables.
 */
export function codificarItf(digitos: string): number[] {
  if (!esCodificableItf(digitos)) {
    throw new RangeError('ITF codifica solo una cantidad par de dígitos.');
  }

  const anchos = [...INICIO];
  for (let i = 0; i < digitos.length; i += 2) {
    const barras = PATRONES[Number(digitos[i])];
    const espacios = PATRONES[Number(digitos[i + 1])];
    for (let j = 0; j < 5; j += 1) {
      anchos.push(ancho(barras?.[j]), ancho(espacios?.[j]));
    }
  }
  anchos.push(...FIN);
  return anchos;
}
