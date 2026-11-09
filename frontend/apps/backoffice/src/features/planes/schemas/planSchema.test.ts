import { expect, it } from 'vitest';
import { aPlanRequest, planSchema } from './planSchema';

const base = {
  codigo: 'TR',
  nombre: 'Todo Riesgo',
  descripcion: 'Cobertura',
  primaBase: '27.500,00',
  tiposPermitidos: ['Auto', 'Camioneta'],
  antiguedadMaxima: '10',
};

it.each([
  ['nombre', '', 'El nombre del plan es obligatorio.'],
  ['primaBase', '0', 'La prima base debe ser mayor que cero.'],
  ['tiposPermitidos', [], 'Debe indicar al menos un tipo de vehículo permitido.'],
])('rechaza %s inválido', (campo, valor, mensaje) => {
  const resultado = planSchema.safeParse({ ...base, [campo]: valor });
  expect(resultado.error?.issues[0]).toMatchObject({ path: [campo], message: mensaje });
});

it('convierte antigüedad vacía a null', () => {
  expect(
    aPlanRequest(planSchema.parse({ ...base, antiguedadMaxima: '' })).antiguedadMaxima,
  ).toBeNull();
});

it('serializa los tipos en orden canónico', () => {
  expect(
    aPlanRequest(planSchema.parse({ ...base, tiposPermitidos: ['Camioneta', 'Auto'] }))
      .tiposPermitidos,
  ).toBe('Auto,Camioneta');
});
