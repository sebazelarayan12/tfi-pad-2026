import { z } from 'zod';

export const MENSAJE_FORMATO_POLIZA = 'Usá el formato POL-0000001.';

/** Número de póliza del rail de caja: `POL-` y siete dígitos (B11 §6; el mensaje es propuesta). */
export const buscarPolizaSchema = z.object({
  numero: z.string().trim().regex(/^POL-\d{7}$/, MENSAJE_FORMATO_POLIZA),
});
