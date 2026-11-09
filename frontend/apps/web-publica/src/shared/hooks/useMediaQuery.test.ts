import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useEsEscritorio, useMediaQuery } from './useMediaQuery';

type Oyente = () => void;

function simularMatchMedia(inicial: boolean) {
  const oyentes = new Set<Oyente>();
  let coincide = inicial;
  const matchMedia = vi.fn((query: string) => ({
    media: query,
    get matches() {
      return coincide;
    },
    addEventListener: (_: string, oyente: Oyente) => oyentes.add(oyente),
    removeEventListener: (_: string, oyente: Oyente) => oyentes.delete(oyente),
  }));
  vi.stubGlobal('matchMedia', matchMedia);
  return {
    matchMedia,
    oyentes,
    cambiar(valor: boolean) {
      coincide = valor;
      oyentes.forEach((oyente) => oyente());
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('useMediaQuery', () => {
  it('sin matchMedia devuelve true (vista de escritorio)', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('devuelve el valor actual y se actualiza cuando cambia', () => {
    const simulacion = simularMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => simulacion.cambiar(true));
    expect(result.current).toBe(true);
  });

  it('quita el oyente al desmontar', () => {
    const simulacion = simularMatchMedia(true);
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(simulacion.oyentes.size).toBe(1);

    unmount();
    expect(simulacion.oyentes.size).toBe(0);
  });

  it('useEsEscritorio consulta el breakpoint de 768 px', () => {
    const simulacion = simularMatchMedia(true);
    const { result } = renderHook(() => useEsEscritorio());
    expect(result.current).toBe(true);
    expect(simulacion.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
  });
});
