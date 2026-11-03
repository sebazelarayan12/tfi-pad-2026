import { expect, it } from 'vitest';
import {
  problemaErrorInesperado,
  problemaNegocio,
  problemaNoEncontrado,
  problemaRateLimit,
  problemaSinPermiso,
  problemaSinSesion,
  problemaValidacion,
} from '../../mocks/fixtures/comunes';

it('representa 401 y 403 sin detail', () => {
  for (const [problema, status] of [
    [problemaSinSesion(), 401],
    [problemaSinPermiso(), 403],
  ] as const) {
    expect(problema.status).toBe(status);
    expect(problema).not.toHaveProperty('detail');
  }
});

it('conserva las claves PascalCase de los errores de validación', () => {
  const errors = { Email: ['El email es obligatorio.'] };
  expect(problemaValidacion(errors)).toMatchObject({ status: 400, errors });
});

it('devuelve el mensaje fijo de 429 sin Retry-After', () => {
  const problema = problemaRateLimit();
  expect(problema).toMatchObject({
    status: 429,
    detail: 'Se superó el límite de intentos. Volvé a intentarlo en un minuto.',
  });
  expect(problema).not.toHaveProperty('Retry-After');
});

it('conserva el detalle de negocio y el código opcional de 404', () => {
  expect(problemaNegocio('Inválido')).toMatchObject({ status: 400, detail: 'Inválido' });
  expect(problemaNoEncontrado('No existe')).not.toHaveProperty('codigo');
  expect(problemaNoEncontrado('No existe', 'CLIENTE_NO_ENCONTRADO')).toMatchObject({
    status: 404,
    codigo: 'CLIENTE_NO_ENCONTRADO',
  });
  expect(problemaErrorInesperado()).toMatchObject({
    status: 500,
    detail: 'Ocurrió un error inesperado.',
  });
});
