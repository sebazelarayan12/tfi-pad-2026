import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Aparecer } from './Aparecer';

afterEach(() => vi.unstubAllGlobals());

describe('Aparecer', () => {
  it('sin IntersectionObserver muestra el contenido de entrada', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<Aparecer>contenido</Aparecer>);
    expect(screen.getByText('contenido')).toHaveClass('opacity-100');
  });

  it('empieza oculto y aparece cuando entra en pantalla', () => {
    let avisar: (entradas: Array<{ isIntersecting: boolean }>) => void = () => undefined;
    const desconectar = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof avisar) {
          avisar = callback;
        }
        observe = vi.fn();
        disconnect = desconectar;
      },
    );

    render(<Aparecer retardoMs={200}>contenido</Aparecer>);
    const bloque = screen.getByText('contenido');
    expect(bloque).toHaveClass('opacity-0');
    expect(bloque).toHaveStyle({ transitionDelay: '200ms' });

    act(() => avisar([{ isIntersecting: true }]));
    expect(bloque).toHaveClass('opacity-100');
    expect(desconectar).toHaveBeenCalled();
  });
});
