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

/** Acción secundaria llena, en el marino del logo (blanca en modo oscuro). */
export const BOTON_MARINO = `${BOTON} bg-tema-boton-fuerte text-tema-sobre-fuerte hover:bg-tema-boton-fuerte-hover`;

/** Botón de borde blanco para usar sobre fotos o fondos oscuros. */
export const BOTON_FANTASMA_CLARO = `${BOTON} border border-white text-white hover:bg-white/10`;

/** Botón de borde marino (blanco en modo oscuro). */
export const BOTON_FANTASMA = `${BOTON} border border-tema-titulo text-tema-titulo hover:bg-tema-fondo-alt`;

/**
 * Sección a todo el ancho. Las de niebla entran y salen en degradé desde el blanco, así el cambio
 * de una sección a otra no se nota como un corte (como en la referencia del DESIGN.md).
 */
export const SECCION_BLANCA = `${ANCHO_COMPLETO} bg-tema-fondo`;
export const SECCION_NIEBLA = `${ANCHO_COMPLETO} bg-gradient-to-b from-tema-fondo via-tema-fondo-alt to-tema-fondo`;

/** Banda marina a todo el ancho; los fundidos de arriba y abajo los ponen `FUNDIDO_*`. */
export const SECCION_MARINA = `${ANCHO_COMPLETO} bg-tema-banda`;

/** Fundidos decorativos para entrar y salir de una banda marina sin un corte. */
// Son altos para que el paso de color sea lento, y se meten un poco debajo del contenido de la banda
// (margen negativo) para no sumar tanto espacio vacío.
export const FUNDIDO_A_MARINO = 'fundido-a-marino -mb-sp-48 h-80 md:-mb-40 md:h-[560px]';
export const FUNDIDO_DESDE_MARINO = 'fundido-desde-marino -mt-sp-48 h-80 md:-mt-40 md:h-[560px]';

/** Contenido de una sección: contenedor de página y aire vertical generoso. */
export const INTERIOR_SECCION = `${CONTENEDOR} flex flex-col gap-sp-40 py-sp-64 md:py-sp-112`;

/** Título de sección grande, en Montserrat con tracking negativo. */
export const TITULO_SECCION = 'text-titulo-lg md:text-titulo-xl';

/** Botón blanco lleno para usar sobre fotos. */
export const BOTON_BLANCO = `${BOTON} bg-white text-marca-marino hover:bg-white/90`;
