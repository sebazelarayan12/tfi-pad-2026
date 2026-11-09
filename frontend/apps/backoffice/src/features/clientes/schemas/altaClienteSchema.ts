import { quitarFormatoDni, type SexoCliente } from '@nexa/api';
import { z } from 'zod';

import { edadEnAnios, esTelefonoArgentino, leerFecha } from './formatos';
import { PROVINCIAS } from './provincias';

export const SEXOS: readonly SexoCliente[] = ['F', 'M', 'X'];

const esSexo = (valor: string): valor is SexoCliente => SEXOS.some((sexo) => sexo === valor);
const esProvincia = (valor: string): valor is (typeof PROVINCIAS)[number] =>
  PROVINCIAS.some((provincia) => provincia === valor);

export const MENSAJES_ALTA = {
  dni: 'El DNI debe tener 8 dígitos.',
  cuil: 'El CUIL debe tener 11 dígitos.',
  nombre: 'Ingresá el nombre.',
  apellido: 'Ingresá el apellido.',
  fechaObligatoria: 'La fecha de nacimiento es obligatoria.',
  fechaInvalida: 'Ingresá una fecha válida.',
  menor: 'El cliente debe tener 18 años o más.',
  emailObligatorio: 'Ingresá el email.',
  emailFormato: 'El email no tiene un formato válido.',
  telefono: 'Ingresá un teléfono argentino válido, con código de área.',
  sexo: 'Elegí el sexo.',
  calle: 'Ingresá la calle.',
  numero: 'Ingresá el número.',
  numeroFormato: 'El número solo admite dígitos.',
  localidad: 'Ingresá la localidad.',
  provincia: 'Elegí la provincia.',
  codigoPostal: 'Ingresá el código postal.',
  codigoPostalFormato: 'El código postal solo admite dígitos.',
} as const;

const textoObligatorio = (mensaje: string, maximo: number) =>
  z.string().trim().min(1, mensaje).max(maximo, `Supera el largo máximo de ${maximo} caracteres.`);

const soloDigitos = (obligatorio: string, formato: string, maximo: number) =>
  z
    .string()
    .trim()
    .min(1, obligatorio)
    .regex(/^\d+$/, formato)
    .max(maximo, `Supera el largo máximo de ${maximo} caracteres.`);

export const altaClienteSchema = z.object({
  dni: z
    .string()
    .transform((valor) => quitarFormatoDni(valor))
    .pipe(z.string().regex(/^\d{8}$/, MENSAJES_ALTA.dni)),
  sexo: z.string().refine(esSexo, MENSAJES_ALTA.sexo),
  nombre: textoObligatorio(MENSAJES_ALTA.nombre, 100),
  apellido: textoObligatorio(MENSAJES_ALTA.apellido, 100),
  cuil: z
    .string()
    .transform((valor) => valor.replace(/[\s-]/g, ''))
    .pipe(z.string().regex(/^\d{11}$/, MENSAJES_ALTA.cuil)),
  fechaNacimiento: z
    .string()
    .trim()
    .min(1, MENSAJES_ALTA.fechaObligatoria)
    .superRefine((valor, contexto) => {
      const fecha = leerFecha(valor);
      if (!fecha) {
        contexto.addIssue({ code: 'custom', message: MENSAJES_ALTA.fechaInvalida });
        return;
      }
      if (edadEnAnios(fecha) < 18) {
        contexto.addIssue({ code: 'custom', message: MENSAJES_ALTA.menor });
      }
    }),
  email: z
    .string()
    .trim()
    .min(1, MENSAJES_ALTA.emailObligatorio)
    .max(150, 'Supera el largo máximo de 150 caracteres.')
    .pipe(z.email(MENSAJES_ALTA.emailFormato)),
  telefono: z
    .string()
    .trim()
    .max(20, 'Supera el largo máximo de 20 caracteres.')
    .refine((valor) => valor === '' || esTelefonoArgentino(valor), MENSAJES_ALTA.telefono),
  calle: textoObligatorio(MENSAJES_ALTA.calle, 150),
  numero: soloDigitos(MENSAJES_ALTA.numero, MENSAJES_ALTA.numeroFormato, 20),
  localidad: textoObligatorio(MENSAJES_ALTA.localidad, 100),
  provincia: z.string().refine(esProvincia, MENSAJES_ALTA.provincia),
  codigoPostal: soloDigitos(MENSAJES_ALTA.codigoPostal, MENSAJES_ALTA.codigoPostalFormato, 10),
});

/** Lo que el usuario escribe: todo texto, el select vacío es `''`. */
export type AltaClienteFormValues = z.input<typeof altaClienteSchema>;
/** Lo que queda después de validar y limpiar. */
export type AltaClienteValidado = z.output<typeof altaClienteSchema>;
