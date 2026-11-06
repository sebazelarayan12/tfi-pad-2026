const formatoEntero = new Intl.NumberFormat('es-AR');

export function formatConteo(valor: number) {
  return formatoEntero.format(valor);
}

export function porcentajePolizas(conteo: number, total: number): number {
  return total === 0 ? 0 : Math.round((conteo * 100) / total);
}

// pathLength=100 normaliza la circunferencia del SVG.
export function segmentosPolizas(conteos: number[], total: number) {
  let offset = 0;
  return conteos.map((conteo) => {
    const longitud = total === 0 ? 0 : (conteo * 100) / total;
    const segmento = { longitud, offset };
    offset += longitud;
    return segmento;
  });
}
