import { expect, it } from 'vitest';
import { segmentosPolizas } from './distribucionPolizas';

it('los segmentos suman la circunferencia y sus offsets son acumulativos', () => {
  const segmentos = segmentosPolizas([312, 27, 9, 15, 27], 390);
  expect(segmentos.reduce((suma, segmento) => suma + segmento.longitud, 0)).toBeCloseTo(100);
  expect(segmentos[0].offset).toBe(0);
  expect(segmentos[1].offset).toBe(80);
});
