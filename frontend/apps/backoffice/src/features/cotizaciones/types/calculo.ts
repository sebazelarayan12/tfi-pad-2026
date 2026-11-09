import type { OpcionCotizacion } from '@nexa/api';
import { z } from 'zod';

const calculoSchema = z.object({
  primaBase: z.number(),
  factorTipo: z.number(),
  factorAntiguedad: z.number(),
  factorEdad: z.number(),
  factorUso: z.number(),
});

export type CalculoPrima = z.infer<typeof calculoSchema>;
export type OpcionConCalculo = OpcionCotizacion & { calculo?: CalculoPrima | null };

/** PB-10: el mock incluye el desglose, pero la respuesta publicada puede omitirlo. */
export function leerCalculo(opcion: OpcionConCalculo): CalculoPrima | undefined {
  const resultado = calculoSchema.safeParse(opcion.calculo);
  return resultado.success ? resultado.data : undefined;
}
