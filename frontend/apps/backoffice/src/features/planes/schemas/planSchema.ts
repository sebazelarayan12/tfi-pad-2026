import { formatearImporte, parseImporteEsAR, type PlanRequest, type PlanResponse } from '@nexa/api';
import { z } from 'zod';

export const TIPOS_VEHICULO = ['Auto', 'Moto', 'Camioneta'] as const;
export const MENSAJES_PLAN = {
  codigo: 'El código del plan es obligatorio.',
  nombre: 'El nombre del plan es obligatorio.',
  descripcion: 'La descripción del plan es obligatoria.',
  primaBase: 'La prima base debe ser mayor que cero.',
  tiposPermitidos: 'Debe indicar al menos un tipo de vehículo permitido.',
  antiguedadMaxima: 'La antigüedad máxima debe ser mayor o igual a cero.',
};

export const planSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, MENSAJES_PLAN.codigo)
    .max(10, 'El código no puede superar los 10 caracteres.'),
  nombre: z
    .string()
    .trim()
    .min(1, MENSAJES_PLAN.nombre)
    .max(80, 'El nombre no puede superar los 80 caracteres.'),
  descripcion: z
    .string()
    .trim()
    .min(1, MENSAJES_PLAN.descripcion)
    .max(500, 'La descripción no puede superar los 500 caracteres.'),
  primaBase: z
    .string()
    .transform((texto, ctx) => {
      const importe = parseImporteEsAR(texto);
      if (importe === null) {
        ctx.addIssue({ code: 'custom', message: 'Ingresá un importe válido.' });
        return z.NEVER;
      }
      return importe;
    })
    .pipe(z.number().positive(MENSAJES_PLAN.primaBase)),
  tiposPermitidos: z.array(z.enum(TIPOS_VEHICULO)).min(1, MENSAJES_PLAN.tiposPermitidos),
  antiguedadMaxima: z
    .string()
    .trim()
    .transform((texto) => {
      if (texto === '') return null;
      return /^-?\d+$/.test(texto) ? Number(texto) : NaN;
    })
    .pipe(
      z
        .number({ error: 'Ingresá una antigüedad válida.' })
        .int()
        .min(0, MENSAJES_PLAN.antiguedadMaxima)
        .max(2147483647, 'La antigüedad supera el máximo permitido.')
        .nullable(),
    ),
});

export function desdePlanResponse(plan: PlanResponse): z.input<typeof planSchema> {
  const tipos = plan.tiposPermitidos.split(',').map((tipo) => tipo.trim());
  return {
    codigo: plan.codigo,
    nombre: plan.nombre,
    descripcion: plan.descripcion,
    primaBase: formatearImporte(plan.primaBase),
    tiposPermitidos: TIPOS_VEHICULO.filter((tipo) => tipos.includes(tipo)),
    antiguedadMaxima: plan.antiguedadMaxima == null ? '' : String(plan.antiguedadMaxima),
  };
}

export function aPlanRequest(valores: z.output<typeof planSchema>): PlanRequest {
  return {
    ...valores,
    tiposPermitidos: TIPOS_VEHICULO.filter((tipo) => valores.tiposPermitidos.includes(tipo)).join(
      ',',
    ),
  };
}
