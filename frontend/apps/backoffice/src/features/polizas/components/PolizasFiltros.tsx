import { useRef, type KeyboardEvent } from 'react';

import { ESTADOS_FILTRO, type FiltrosPolizas } from '../schemas/polizasListadoQuery';
import { ETIQUETA_FILTRO_ESTADO, ETIQUETA_TODAS } from '../textos';

type EstadoFiltro = FiltrosPolizas['estado'];

interface PolizasFiltrosProps {
  estado: EstadoFiltro;
  onCambiar: (estado: EstadoFiltro) => void;
}

const OPCIONES: ReadonlyArray<{ valor: EstadoFiltro; label: string }> = [
  { valor: undefined, label: ETIQUETA_TODAS },
  ...ESTADOS_FILTRO.map((nombre) => ({ valor: nombre, label: nombre })),
];

// Mismas clases que `Chip` (design-system §5.5). El Chip de @nexa/ui es un botón con
// `aria-pressed` y B9 §12 pide `role="radio"` con `aria-checked`, así que el grupo arma sus radios.
const BASE =
  'inline-flex h-7 items-center rounded-pill px-sp-12 py-sp-4 text-label focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary';
const SELECCIONADO = 'bg-action-primary text-action-on-primary';
const SIN_SELECCIONAR = 'border border-border-strong bg-surface-panel text-text-primary';

function pasoDeTecla(tecla: string): number {
  if (tecla === 'ArrowRight' || tecla === 'ArrowDown') return 1;
  if (tecla === 'ArrowLeft' || tecla === 'ArrowUp') return -1;
  return 0;
}

/** Chips de estado de selección única (radiogroup). Flechas para moverse entre chips. */
export function PolizasFiltros({ estado, onCambiar }: PolizasFiltrosProps) {
  const botones = useRef<Array<HTMLButtonElement | null>>([]);
  const indiceActivo = OPCIONES.findIndex((opcion) => opcion.valor === estado);

  function alPresionar(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const paso = pasoDeTecla(evento.key);
    if (paso === 0) return;
    evento.preventDefault();
    const destino = (indice + paso + OPCIONES.length) % OPCIONES.length;
    botones.current[destino]?.focus();
    onCambiar(OPCIONES[destino]?.valor);
  }

  return (
    <div role="radiogroup" aria-label={ETIQUETA_FILTRO_ESTADO} className="flex flex-wrap gap-sp-8">
      {OPCIONES.map(({ valor, label }, indice) => {
        const activo = indice === indiceActivo;
        return (
          <button
            key={label}
            ref={(nodo) => {
              botones.current[indice] = nodo;
            }}
            type="button"
            role="radio"
            aria-checked={activo}
            tabIndex={activo ? 0 : -1}
            onClick={() => onCambiar(valor)}
            onKeyDown={(evento) => alPresionar(evento, indice)}
            className={`${BASE} ${activo ? SELECCIONADO : SIN_SELECCIONAR}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
