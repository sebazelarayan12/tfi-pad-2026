import { z } from 'zod';

/**
 * Espejo zod de `ProblemDetails` y `ValidationProblemDetails` (T-12, `dto/comunes.ts`).
 * Contrato: `docs/frontend/contratos-api/convenciones-transversales.md` §3.4.
 *
 * Los esquemas de respuesta son `looseObject`: aceptan campos extra del back
 * (`codigo`, `extensions`); un campo requerido que falta sí falla.
 *
 * Dueño: US-FE-T-23.
 */

const textoOpcional = z.string().nullable().optional();

/** Forma A, C y D sin `errors`: `status` siempre presente, el resto es opcional. */
export const esquemaProblemDetails = z.looseObject({
  type: textoOpcional,
  title: textoOpcional,
  status: z.number().int(),
  detail: textoOpcional,
  instance: textoOpcional,
  traceId: textoOpcional,
});

/** Forma B: 400 de validación automática. Las claves de `errors` llegan en PascalCase. */
export const esquemaValidationProblemDetails = z.looseObject({
  type: textoOpcional,
  title: textoOpcional,
  status: z.literal(400),
  detail: textoOpcional,
  instance: textoOpcional,
  traceId: textoOpcional,
  errors: z.record(z.string(), z.array(z.string())),
});
