import type { UseFormReturn } from 'react-hook-form';

import type { AltaClienteFormValues, AltaClienteValidado } from '../schemas/altaClienteSchema';
import type { CampoRenaper } from '../schemas/datosRenaperAFormulario';

export type FormularioAlta = UseFormReturn<AltaClienteFormValues, unknown, AltaClienteValidado>;

export interface PropsSeccion {
  form: FormularioAlta;
  deshabilitado: boolean;
}

/** Secciones que Renaper puede precargar: saben si un campo sigue con el valor de Renaper. */
export interface PropsSeccionRenaper extends PropsSeccion {
  esDatoRenaper: (campo: CampoRenaper) => boolean;
}

export const VALORES_VACIOS_ALTA: AltaClienteFormValues = {
  dni: '',
  sexo: '',
  nombre: '',
  apellido: '',
  cuil: '',
  fechaNacimiento: '',
  email: '',
  telefono: '',
  calle: '',
  numero: '',
  localidad: '',
  provincia: '',
  codigoPostal: '',
};
