import { handlers as auth } from './auth';
import { handlers as clientes } from './clientes';
import { handlers as cotizaciones } from './cotizaciones';
import { handlers as inicio } from './inicio';
import { handlers as pagofacil } from './pagofacil';
import { handlers as pagos } from './pagos';
import { handlers as planes } from './planes';
import { handlers as polizas } from './polizas';
import { handlers as publico } from './publico';
import { handlers as usuarios } from './usuarios';
import { handlers as vehiculos } from './vehiculos';

// Agregá cada handler al arreglo exportado por el archivo de su dominio.
export const handlers = [
  ...auth,
  ...clientes,
  ...cotizaciones,
  ...inicio,
  ...pagofacil,
  ...pagos,
  ...planes,
  ...polizas,
  ...publico,
  ...usuarios,
  ...vehiculos,
];
