import type { PersonaRenaperResponse } from '@nexa/api';

import type { AltaClienteFormValues } from './altaClienteSchema';
import { deFechaIso, enmascararCuil } from './formatos';
import { PROVINCIAS } from './provincias';

/** Campos que Renaper completa en el alta. El DNI no: es la clave de la consulta. */
export const CAMPOS_RENAPER = [
  'sexo',
  'nombre',
  'apellido',
  'cuil',
  'fechaNacimiento',
  'calle',
  'numero',
  'localidad',
  'provincia',
  'codigoPostal',
] as const satisfies readonly (keyof AltaClienteFormValues)[];

export type CampoRenaper = (typeof CAMPOS_RENAPER)[number];
export type DatosRenaperFormulario = Record<CampoRenaper, string>;

/**
 * Valores del formulario a partir de la respuesta de Renaper (B4 §9). Piso y departamento se
 * ignoran (D-B06-3). Una provincia fuera de la lista fija queda vacía: el Select no puede
 * mostrar un valor que no ofrece.
 */
export function datosRenaperAFormulario(persona: PersonaRenaperResponse): DatosRenaperFormulario {
  const { domicilio } = persona;
  return {
    sexo: persona.sexo,
    nombre: persona.nombre,
    apellido: persona.apellido,
    cuil: enmascararCuil(persona.cuil),
    fechaNacimiento: deFechaIso(persona.fechaNacimiento),
    calle: domicilio.calle,
    numero: domicilio.numero,
    localidad: domicilio.localidad,
    provincia: (PROVINCIAS as readonly string[]).includes(domicilio.provincia)
      ? domicilio.provincia
      : '',
    codigoPostal: domicilio.codigoPostal,
  };
}
