/**
 * Meses entre dos `yyyy-MM-dd` con los componentes de la fecha, sin `Date` con zona (DN-W4-5).
 * Una vigencia que no llega al día del mes de inicio cuenta un mes menos.
 */
export function mesesDeVigencia(desde: string, hasta: string): number {
  const [anioDesde, mesDesde, diaDesde] = desde.split('-').map(Number);
  const [anioHasta, mesHasta, diaHasta] = hasta.split('-').map(Number);
  if ([anioDesde, mesDesde, diaDesde, anioHasta, mesHasta, diaHasta].some((n) => n === undefined)) {
    return 0;
  }
  const meses = (anioHasta! - anioDesde!) * 12 + (mesHasta! - mesDesde!);
  return Math.max(0, diaHasta! < diaDesde! ? meses - 1 : meses);
}

/** "12 meses" o "1 mes". */
export function textoMeses(meses: number): string {
  return meses === 1 ? '1 mes' : `${meses} meses`;
}
