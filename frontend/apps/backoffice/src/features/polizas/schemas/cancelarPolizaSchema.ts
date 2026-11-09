import { z } from 'zod';

import { MOTIVO_MAXIMO } from '../lib/motivo';

export const MSG_MOTIVO_VACIO = 'Ingresá un motivo para cancelar la póliza.';
export const MSG_MOTIVO_LARGO = `El motivo no puede tener más de ${MOTIVO_MAXIMO} caracteres.`;

export const cancelarPolizaSchema = z.object({
  motivo: z.string().trim().min(1, MSG_MOTIVO_VACIO).max(MOTIVO_MAXIMO, MSG_MOTIVO_LARGO),
});
