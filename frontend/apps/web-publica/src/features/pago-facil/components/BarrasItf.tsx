import { codificarItf, ZONA_SILENCIO } from './itf';

interface BarrasItfProps {
  digitos: string;
}

interface Barra {
  x: number;
  ancho: number;
}

/** Posiciones de las barras en módulos; los espacios quedan como huecos entre ellas. */
function barrasDe(digitos: string): { barras: Barra[]; total: number } {
  const barras: Barra[] = [];
  let x = ZONA_SILENCIO;
  codificarItf(digitos).forEach((ancho, indice) => {
    if (indice % 2 === 0) barras.push({ x, ancho });
    x += ancho;
  });
  return { barras, total: x + ZONA_SILENCIO };
}

/**
 * Barras ITF del código (DN-W7-1). Decorativas para el lector de pantalla: los dígitos van debajo
 * con su `aria-label` (W5 §12). Escala solo a lo ancho. Se deja el suavizado del navegador: con
 * `crispEdges` cada módulo se redondea a píxeles enteros, la relación ancho/angosto se deforma y
 * el código deja de leerse (probado con un lector ITF sobre capturas a 1x, 2x y 3x).
 */
export function BarrasItf({ digitos }: BarrasItfProps) {
  const { barras, total } = barrasDe(digitos);

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-testid="barras-itf"
      viewBox={`0 0 ${total} 72`}
      preserveAspectRatio="none"
      className="h-[72px] w-full max-w-[560px] bg-surface-panel text-text-primary"
    >
      {barras.map((barra) => (
        <rect key={barra.x} x={barra.x} y={0} width={barra.ancho} height={72} fill="currentColor" />
      ))}
    </svg>
  );
}
