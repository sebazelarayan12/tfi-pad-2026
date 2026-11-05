import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { expectSinViolacionesA11y } from './a11y';

// Markup inaccesible a propósito: se arma como HTML para no escribir JSX que el lint rechaza.
function montarHtml(html: string): HTMLElement {
  const contenedor = document.createElement('div');
  contenedor.innerHTML = html;
  document.body.append(contenedor);
  return contenedor;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('expectSinViolacionesA11y', () => {
  it('pasa con un botón con texto', async () => {
    const { container } = render(
      <main>
        <button type="button">Guardar</button>
      </main>,
    );
    await expect(expectSinViolacionesA11y(container)).resolves.toBeUndefined();
  });

  it('pasa con un contenedor vacío', async () => {
    await expect(expectSinViolacionesA11y(montarHtml(''))).resolves.toBeUndefined();
  });

  it('falla con un img sin alt', async () => {
    const contenedor = montarHtml('<main><img src="logo.png"></main>');
    await expect(expectSinViolacionesA11y(contenedor)).rejects.toThrow();
  });

  it('falla con un input sin label', async () => {
    const contenedor = montarHtml('<main><input type="text"></main>');
    await expect(expectSinViolacionesA11y(contenedor)).rejects.toThrow();
  });

  it('ignora solo las reglas listadas en opciones.ignorar', async () => {
    const soloImg = montarHtml('<main><img src="logo.png"></main>');
    await expect(expectSinViolacionesA11y(soloImg)).rejects.toThrow();
    // `image-alt` se ignora solo para probar la opción: el img no tiene alt a propósito.
    await expect(
      expectSinViolacionesA11y(soloImg, { ignorar: ['image-alt'] }),
    ).resolves.toBeUndefined();

    const imgEInput = montarHtml('<main><img src="logo.png"><input type="text"></main>');
    // Ignorar `image-alt` no apaga las demás reglas: el input sin label sigue fallando.
    await expect(expectSinViolacionesA11y(imgEInput, { ignorar: ['image-alt'] })).rejects.toThrow();
  });
});
