import type { UsoVehiculo, VehiculoAltaRequest } from '@nexa/api';
import { z } from 'zod';

export const MENSAJE_PATENTE_INVALIDA = 'Ingresá una patente con formato AB123CD o ABC123.';
const patenteRegex = /^(?:[A-Z]{2}[0-9]{3}[A-Z]{2}|[A-Z]{3}[0-9]{3})$/;

export const vehiculoAltaSchema = z.object({
  patente: z.string().trim().toUpperCase().regex(patenteRegex, MENSAJE_PATENTE_INVALIDA),
  uso: z.enum(['0', '1']),
});

export type VehiculoAltaValues = z.infer<typeof vehiculoAltaSchema>;

export const altaInicial: VehiculoAltaValues = { patente: '', uso: '0' };

export function toVehiculoAltaRequest(
  valores: VehiculoAltaValues,
  clienteId: string,
): VehiculoAltaRequest {
  return { clienteId, patente: valores.patente, uso: Number(valores.uso) as UsoVehiculo };
}
