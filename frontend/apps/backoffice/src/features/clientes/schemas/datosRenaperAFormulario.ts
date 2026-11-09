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
/** Solo los campos que Renaper publicó: los que faltan conservan lo que cargó el empleado. */
export type DatosRenaperFormulario = Partial<Record<CampoRenaper, string>>;

/**
 * Valores del formulario a partir de la respuesta de Renaper (B4 §9). Piso y departamento se
 * ignoran (D-B06-3). Una provincia fuera de la lista fija queda vacía: el Select no puede
 * mostrar un valor que no ofrece. Lo que Renaper no publica no aparece en el resultado, y el
 * nombre solo se precarga junto con el apellido (OpenRENAPER los entrega en un solo texto).
 */
export function datosRenaperAFormulario(persona: PersonaRenaperResponse): DatosRenaperFormulario {
  const { domicilio } = persona;
  return {
    ...(persona.sexo ? { sexo: persona.sexo } : {}),
    ...(persona.apellido ? { nombre: persona.nombre, apellido: persona.apellido } : {}),
    ...(persona.cuil ? { cuil: enmascararCuil(persona.cuil) } : {}),
    ...(persona.fechaNacimiento ? { fechaNacimiento: deFechaIso(persona.fechaNacimiento) } : {}),
    ...(domicilio
      ? {
          calle: domicilio.calle,
          numero: domicilio.numero,
          localidad: domicilio.localidad,
          provincia: (PROVINCIAS as readonly string[]).includes(domicilio.provincia)
            ? domicilio.provincia
            : '',
          codigoPostal: domicilio.codigoPostal,
        }
      : {}),
  };
}
