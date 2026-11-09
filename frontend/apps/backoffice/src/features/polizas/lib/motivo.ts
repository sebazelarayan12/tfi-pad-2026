export const MOTIVO_MAXIMO = 200;

export const recortar = (texto: string) => texto.trim();

/** Cuenta los caracteres después de recortar, igual que el back. */
export const largo = (texto: string) => recortar(texto).length;
