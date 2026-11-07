import { expect, it } from 'vitest';
import { ordenarOpciones } from './ordenarOpciones';

it('ordena por prima ascendente sin alterar las opciones recibidas', () => {
  const opciones = Object.freeze([
    { idCotizacion: 'tr', codigoPlan: 'TR', plan: 'Todo Riesgo', primaMensual: 30250 },
    { idCotizacion: 'rc', codigoPlan: 'RC', plan: 'Responsabilidad Civil', primaMensual: 11000 },
    { idCotizacion: 'tc', codigoPlan: 'TC', plan: 'Terceros Completo', primaMensual: 19800 },
  ]);
  expect(ordenarOpciones(opciones).map(({ codigoPlan }) => codigoPlan)).toEqual(['RC', 'TC', 'TR']);
  expect(opciones.map(({ codigoPlan }) => codigoPlan)).toEqual(['TR', 'RC', 'TC']);
});
