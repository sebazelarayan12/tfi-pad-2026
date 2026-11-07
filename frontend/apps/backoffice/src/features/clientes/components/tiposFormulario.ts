import type { UseFormReturn } from 'react-hook-form';

import type { AltaClienteFormValues, AltaClienteValidado } from '../schemas/altaClienteSchema';

export type FormularioAlta = UseFormReturn<AltaClienteFormValues, unknown, AltaClienteValidado>;

export interface PropsSeccion {
  form: FormularioAlta;
  deshabilitado: boolean;
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
