import { isApiError, leerMensajeDetalle, traducirMensajeValidacion } from '@nexa/api';

import type { AltaClienteFormValues } from '../schemas/altaClienteSchema';

export type CampoAlta = keyof AltaClienteFormValues;

export const MENSAJE_GENERAL_ALTA =
  'No pudimos guardar el cliente. Revisá los datos e intentá de nuevo.';

const CAMPOS: Record<string, CampoAlta> = {
  dni: 'dni',
  sexo: 'sexo',
  nombre: 'nombre',
  apellido: 'apellido',
  cuil: 'cuil',
  fechanacimiento: 'fechaNacimiento',
  email: 'email',
  telefono: 'telefono',
  calle: 'calle',
  numero: 'numero',
  localidad: 'localidad',
  provincia: 'provincia',
  codigopostal: 'codigoPostal',
};

export interface ErrorAlta {
  /** Errores del back que corresponden a un campo del formulario. */
  campos: Partial<Record<CampoAlta, string>>;
  /** Texto para el toast cuando el error no pertenece a un campo (FC19). */
  general: string | null;
}

/**
 * Traduce el error del alta a lo que muestra la pantalla. Solo se marca un campo si el back lo
 * indica en `errors` (nunca por el texto de `detail`, FC10); un error de negocio va al toast con
 * el `detail` sin el prefijo `RNxx:`. Los textos en inglés de `errors` se traducen (PB-15).
 */
export function mapearErroresAlta(error: unknown): ErrorAlta {
  if (!isApiError(error) || error.kind !== 'http') {
    return { campos: {}, general: MENSAJE_GENERAL_ALTA };
  }
  if (error.status === 400 && error.errors) {
    const campos: Partial<Record<CampoAlta, string>> = {};
    let sinCampo = false;
    for (const [clave, mensajes] of Object.entries(error.errors)) {
      const campo = CAMPOS[clave.toLowerCase()];
      const mensaje = mensajes[0];
      if (campo === undefined || mensaje === undefined) {
        sinCampo = true;
        continue;
      }
      campos[campo] = traducirMensajeValidacion(mensaje, clave);
    }
    if (Object.keys(campos).length > 0) {
      return { campos, general: sinCampo ? MENSAJE_GENERAL_ALTA : null };
    }
    return { campos: {}, general: MENSAJE_GENERAL_ALTA };
  }
  if (error.status === 400 && error.detail) {
    return { campos: {}, general: leerMensajeDetalle(error).mensaje };
  }
  return { campos: {}, general: MENSAJE_GENERAL_ALTA };
}
