import { expect, it } from 'vitest';
import { handlers } from '../../mocks/handlers';
import { handlers as auth } from '../../mocks/handlers/auth';
import { handlers as clientes } from '../../mocks/handlers/clientes';
import { handlers as cotizaciones } from '../../mocks/handlers/cotizaciones';
import { handlers as cuotas } from '../../mocks/handlers/cuotas';
import { handlers as inicio } from '../../mocks/handlers/inicio';
import { handlers as pagofacil } from '../../mocks/handlers/pagofacil';
import { handlers as pagos } from '../../mocks/handlers/pagos';
import { handlers as planes } from '../../mocks/handlers/planes';
import { handlers as polizas } from '../../mocks/handlers/polizas';
import { handlers as publico } from '../../mocks/handlers/publico';
import { handlers as usuarios } from '../../mocks/handlers/usuarios';
import { handlers as vehiculos } from '../../mocks/handlers/vehiculos';

const dominios = {
  auth,
  clientes,
  cotizaciones,
  cuotas,
  inicio,
  pagofacil,
  pagos,
  planes,
  polizas,
  publico,
  usuarios,
  vehiculos,
};

// T-24, T-27, T-28, T-29, T-30, T-31 y B-26 (auth) ya publican sus handlers.
const dominiosVacios = {
  cotizaciones,
  inicio,
  vehiculos,
};

it('agrega los handlers de los doce dominios', () => {
  expect(handlers).toEqual(Object.values(dominios).flat());
});

it.each(Object.entries(dominiosVacios))('exporta un arreglo vacío para %s', (_dominio, lista) => {
  expect(lista).toEqual([]);
});
