import type { CuotaPublica } from '@nexa/api';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MAXIMO_CUOTAS, useSeleccionCuotas } from './useSeleccionCuotas';

function cuota(numero: number, parcial: Partial<CuotaPublica> = {}): CuotaPublica {
  return {
    idCuota: `cuota-${numero}`,
    numero,
    importe: 25000,
    recargo: 0,
    total: 25000,
    vencimiento: '2026-10-10',
    estado: 'PENDIENTE',
    ...parcial,
  };
}

const CUOTAS: CuotaPublica[] = [
  cuota(1, { estado: 'PAGADA' }),
  cuota(2, { estado: 'ANULADA' }),
  cuota(8, { estado: 'VENCIDA', importe: 25000, recargo: 1250, total: 26250 }),
  cuota(9),
  cuota(10, { vencimiento: '2026-11-10' }),
];

describe('useSeleccionCuotas', () => {
  it('empieza sin selección y con total 0', () => {
    const { result } = renderHook(() => useSeleccionCuotas(CUOTAS));
    expect(result.current.cantidadSeleccionadas).toBe(0);
    expect(result.current.total).toBe(0);
    expect(result.current.cuotaIds).toEqual([]);
    expect(result.current.listaNumeros).toBe('—');
  });

  it('el total se suma en centavos sin error de punto flotante', () => {
    const decimales = [cuota(1, { total: 0.1 }), cuota(2, { total: 0.2 })];
    const { result } = renderHook(() => useSeleccionCuotas(decimales));
    act(() => result.current.seleccionarImpagas());
    // 0.1 + 0.2 === 0.30000000000000004 con números de punto flotante.
    expect(result.current.total).toBe(0.3);
  });

  it('suma el total (con recargo) de las cuotas elegidas', () => {
    const { result } = renderHook(() => useSeleccionCuotas(CUOTAS));
    act(() => result.current.alternar(CUOTAS[2]!));
    act(() => result.current.alternar(CUOTAS[3]!));
    expect(result.current.total).toBe(51250);
    expect(result.current.listaNumeros).toBe('8 y 9');
  });

  it('las cuotas pagadas y anuladas no se pueden elegir', () => {
    const { result } = renderHook(() => useSeleccionCuotas(CUOTAS));
    act(() => result.current.alternar(CUOTAS[0]!));
    act(() => result.current.alternar(CUOTAS[1]!));
    expect(result.current.cantidadSeleccionadas).toBe(0);
  });

  it('alternar una cuota marcada la quita', () => {
    const { result } = renderHook(() => useSeleccionCuotas(CUOTAS));
    act(() => result.current.alternar(CUOTAS[3]!));
    act(() => result.current.alternar(CUOTAS[3]!));
    expect(result.current.cantidadSeleccionadas).toBe(0);
  });

  it('seleccionarImpagas marca solo PENDIENTE y VENCIDA y no quita las marcadas', () => {
    const { result } = renderHook(() => useSeleccionCuotas(CUOTAS));
    act(() => result.current.alternar(CUOTAS[4]!));
    act(() => result.current.seleccionarImpagas());
    expect(result.current.numerosSeleccionados).toEqual([8, 9, 10]);
    expect(result.current.estaSeleccionada('cuota-1')).toBe(false);
    expect(result.current.estaSeleccionada('cuota-2')).toBe(false);
  });

  it('cuotaIds sale ordenado por número aunque se elijan en otro orden', () => {
    const { result } = renderHook(() => useSeleccionCuotas(CUOTAS));
    act(() => result.current.alternar(CUOTAS[4]!));
    act(() => result.current.alternar(CUOTAS[2]!));
    expect(result.current.cuotaIds).toEqual(['cuota-8', 'cuota-10']);
  });

  describe('tope de 24 cuotas', () => {
    const muchas = Array.from({ length: MAXIMO_CUOTAS + 1 }, (_, i) => cuota(i + 1));

    it('seleccionarImpagas se detiene en 24 y bloquea las demás', () => {
      const { result } = renderHook(() => useSeleccionCuotas(muchas));
      act(() => result.current.seleccionarImpagas());
      expect(result.current.cantidadSeleccionadas).toBe(MAXIMO_CUOTAS);
      expect(result.current.alcanzoTope).toBe(true);
      expect(result.current.estaBloqueada(muchas[MAXIMO_CUOTAS]!)).toBe(true);
      expect(result.current.estaBloqueada(muchas[0]!)).toBe(false);
    });

    it('alternar no agrega la cuota 25 pero permite quitar una y agregar otra', () => {
      const { result } = renderHook(() => useSeleccionCuotas(muchas));
      act(() => result.current.seleccionarImpagas());
      act(() => result.current.alternar(muchas[MAXIMO_CUOTAS]!));
      expect(result.current.cantidadSeleccionadas).toBe(MAXIMO_CUOTAS);

      act(() => result.current.alternar(muchas[0]!));
      act(() => result.current.alternar(muchas[MAXIMO_CUOTAS]!));
      expect(result.current.cantidadSeleccionadas).toBe(MAXIMO_CUOTAS);
      expect(result.current.estaSeleccionada('cuota-25')).toBe(true);
    });
  });
});
