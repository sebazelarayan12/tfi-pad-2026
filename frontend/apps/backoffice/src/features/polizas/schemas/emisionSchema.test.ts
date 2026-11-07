import { expect, it } from 'vitest';
import { emisionSchema } from './emisionSchema';

it.each([1, 6, 12])('acepta %s meses', (vigenciaMeses) => {
  expect(emisionSchema.parse({ vigenciaMeses })).toEqual({ vigenciaMeses });
});

it.each([0, 3, '6', undefined])('rechaza la vigencia %s', (vigenciaMeses) => {
  expect(emisionSchema.safeParse({ vigenciaMeses }).success).toBe(false);
});
