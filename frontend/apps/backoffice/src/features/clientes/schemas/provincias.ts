import type { SelectOption } from '@nexa/ui';

/** Las 24 jurisdicciones, en el orden de B4 §5 (D-B05-5). Se guardan como texto libre. */
export const PROVINCIAS = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Ciudad Autónoma de Buenos Aires',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
] as const;

export const OPCIONES_PROVINCIA: readonly SelectOption<string>[] = PROVINCIAS.map((valor) => ({
  value: valor,
  label: valor,
}));
