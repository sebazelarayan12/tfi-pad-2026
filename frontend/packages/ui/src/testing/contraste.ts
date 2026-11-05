const HEX = /^#?([0-9a-f]{6})$/i;
const UMBRAL_LINEAL = 0.03928;

function canal(valor: number): number {
  const c = valor / 255;
  return c <= UMBRAL_LINEAL ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex: string): number {
  const match = HEX.exec(hex);
  if (!match?.[1]) throw new TypeError(`Color hexadecimal inválido: ${hex}`);
  const n = Number.parseInt(match[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/** Ratio de contraste WCAG 2.x entre dos colores `#rrggbb`, redondeado a dos decimales. */
export function ratioContraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  const ratio = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  return Math.round(ratio * 100) / 100;
}
