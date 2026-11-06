import { z } from 'zod';

/** Mensajes literales del back (`seguridad-clientes-publico.md` §6.5), salvo los vacíos (W2 §8). */
export const MENSAJES_CONSULTA = {
  dniVacio: 'Ingresá tu DNI.',
  dniFormato: 'El DNI debe tener 8 dígitos.',
  numeroPolizaVacio: 'Ingresá el número de póliza.',
  numeroPolizaFormato: 'El número de póliza debe tener el formato POL-0000000.',
} as const;

/**
 * Validación del formulario de W2 (`W2-consultar-poliza.md` §6).
 * El DNI se recorta; el número de póliza se recorta y se pasa a mayúsculas (DN-W3-3).
 */
export const consultaSchema = z.object({
  dni: z
    .string()
    .trim()
    .min(1, MENSAJES_CONSULTA.dniVacio)
    .regex(/^\d{8}$/, MENSAJES_CONSULTA.dniFormato),
  numeroPoliza: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, MENSAJES_CONSULTA.numeroPolizaVacio)
    .regex(/^POL-\d{7}$/, MENSAJES_CONSULTA.numeroPolizaFormato),
});

export type ConsultaFormValues = z.infer<typeof consultaSchema>;
