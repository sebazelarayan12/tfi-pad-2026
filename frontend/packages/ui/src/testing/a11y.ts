import { expect } from 'vitest';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import type { AxeMatchers } from 'vitest-axe/matchers';

declare module 'vitest' {
  // Tipado del matcher de vitest-axe para `expect(...)`.
  interface Assertion extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

expect.extend(matchers);

export interface OpcionesA11y {
  /** Reglas de axe a desactivar. Cada uso necesita un comentario con la razón en el test. */
  ignorar?: string[];
}

/**
 * Corre axe sobre `elemento` y falla el test si hay violaciones (FC8, FC16).
 * Para pantallas: los primitivos usan `vitest-axe` directo (RV-49).
 * Pasar el contenedor de la pantalla (o el nodo del portal), no el `document`.
 */
export async function expectSinViolacionesA11y(
  elemento: Element,
  opciones: OpcionesA11y = {},
): Promise<void> {
  const reglas: Record<string, { enabled: boolean }> = {
    // jsdom no calcula estilos reales, así que axe no puede medir contraste.
    // El contraste se cubre con la tabla de pares de `contraste.test.ts`.
    'color-contrast': { enabled: false },
  };
  for (const regla of opciones.ignorar ?? []) reglas[regla] = { enabled: false };

  const resultado = await axe(elemento, { rules: reglas });
  expect(resultado).toHaveNoViolations();
}
