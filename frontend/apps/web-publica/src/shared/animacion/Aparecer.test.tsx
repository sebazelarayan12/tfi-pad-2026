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

  it('empieza oculto, aparece al entrar en pantalla y se desvanece al salir', () => {
    let avisar: (entradas: Array<{ isIntersecting: boolean }>) => void = () => undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof avisar) {
          avisar = callback;
        }
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );

    render(<Aparecer retardoMs={200}>contenido</Aparecer>);
    const bloque = screen.getByText('contenido');
    expect(bloque).toHaveClass('opacity-0');

    // El retraso escalona la entrada.
    act(() => avisar([{ isIntersecting: true }]));
    expect(bloque).toHaveClass('opacity-100');
    expect(bloque).toHaveStyle({ transitionDelay: '200ms' });

    // Al salir vuelve a ocultarse, sin retraso, para poder entrar de nuevo al volver.
    act(() => avisar([{ isIntersecting: false }]));
    expect(bloque).toHaveClass('opacity-0');
    expect(bloque).toHaveStyle({ transitionDelay: '0ms' });
  });

  it('deja de observar al desmontarse', () => {
    const desconectar = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        disconnect = desconectar;
      },
    );
    const { unmount } = render(<Aparecer>contenido</Aparecer>);
    unmount();
    expect(desconectar).toHaveBeenCalled();
  });
});
