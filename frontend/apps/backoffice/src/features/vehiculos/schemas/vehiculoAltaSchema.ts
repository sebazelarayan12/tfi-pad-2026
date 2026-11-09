import type { TipoVehiculo, UsoVehiculo, VehiculoAltaRequest } from '@nexa/api';
import { z } from 'zod';

export const MENSAJE_PATENTE_INVALIDA = 'Ingresá una patente con formato AB123CD o ABC123.';
const ANIO_MINIMO = 1950;
export const MENSAJE_ANIO = 'Ingresá un año de cuatro cifras, desde 1950.';
const patenteRegex = /^(?:[A-Z]{2}[0-9]{3}[A-Z]{2}|[A-Z]{3}[0-9]{3})$/;

export const vehiculoAltaSchema = z.object({
  patente: z.string().trim().toUpperCase().regex(patenteRegex, MENSAJE_PATENTE_INVALIDA),
  uso: z.enum(['0', '1']),
  marca: z.string().trim().min(1, 'Ingresá la marca.'),
  modelo: z.string().trim().min(1, 'Ingresá el modelo.'),
  anio: z
    .string()
    .trim()
    .regex(/^\d{4}$/, MENSAJE_ANIO)
    .refine((valor) => {
      const anio = Number(valor);
      return anio >= ANIO_MINIMO && anio <= new Date().getFullYear() + 1;
    }, MENSAJE_ANIO),
  tipo: z.enum(['0', '1', '2']),
  numeroMotor: z.string().trim().min(1, 'Ingresá el número de motor.'),
  numeroChasis: z.string().trim().min(1, 'Ingresá el número de chasis.'),
});

export type VehiculoAltaValues = z.infer<typeof vehiculoAltaSchema>;

export const altaInicial: VehiculoAltaValues = {
  patente: '',
  uso: '0',
  marca: '',
  modelo: '',
  anio: '',
  tipo: '0',
  numeroMotor: '',
  numeroChasis: '',
};

export function toVehiculoAltaRequest(
  valores: VehiculoAltaValues,
  clienteId: string,
): VehiculoAltaRequest {
  return {
    clienteId,
    patente: valores.patente,
    uso: Number(valores.uso) as UsoVehiculo,
    marca: valores.marca,
    modelo: valores.modelo,
    anio: Number(valores.anio),
    tipo: Number(valores.tipo) as TipoVehiculo,
    numeroMotor: valores.numeroMotor,
    numeroChasis: valores.numeroChasis,
  };
}
