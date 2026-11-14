// Clases de la identidad Nexa Seguros que comparten el layout y las páginas públicas.

/** Ancho máximo de página (1440 px, DESIGN.md) con el margen lateral de cada tamaño. */
export const CONTENEDOR = 'mx-auto w-full max-w-pagina px-sp-16 md:px-sp-40';

/** Saca un bloque del contenedor para que ocupe todo el ancho de la ventana (fotos full-bleed). */
export const ANCHO_COMPLETO = 'relative left-1/2 w-screen -translate-x-1/2';

/** Foco visible en celeste, el color de detalle de la marca. */
export const FOCO =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-celeste';

const BOTON = `inline-flex min-h-11 items-center justify-center gap-sp-8 rounded-boton px-sp-24 text-body font-medium motion-safe:transition-colors motion-safe:duration-200 ${FOCO}`;

/** La acción principal de la pantalla: azul, una sola por pantalla. */
export const BOTON_AZUL = `${BOTON} bg-marca-azul text-white hover:bg-marca-azul-hover`;

/** Acción secundaria llena, en el marino del logo. */
export const BOTON_MARINO = `${BOTON} bg-marca-marino text-white hover:bg-marca-marino-hover`;

/** Botón de borde blanco para usar sobre fotos o fondos oscuros. */
export const BOTON_FANTASMA_CLARO = `${BOTON} border border-white text-white hover:bg-white/10`;

/** Botón de borde marino para fondos claros. */
export const BOTON_FANTASMA = `${BOTON} border border-marca-marino text-marca-marino hover:bg-marca-niebla`;

/** Sección a todo el ancho; se alternan blanco y niebla para marcar el ritmo (DESIGN.md). */
export const SECCION_BLANCA = `${ANCHO_COMPLETO} bg-white`;
export const SECCION_NIEBLA = `${ANCHO_COMPLETO} bg-marca-niebla`;

/** Contenido de una sección: contenedor de página y aire vertical generoso. */
export const INTERIOR_SECCION = `${CONTENEDOR} flex flex-col gap-sp-40 py-sp-64 md:py-sp-112`;

/** Título de sección grande, en Montserrat con tracking negativo. */
export const TITULO_SECCION = 'text-titulo-lg md:text-titulo-xl';

/** Botón blanco lleno para usar sobre fotos. */
export const BOTON_BLANCO = `${BOTON} bg-white text-marca-marino hover:bg-marca-niebla`;
