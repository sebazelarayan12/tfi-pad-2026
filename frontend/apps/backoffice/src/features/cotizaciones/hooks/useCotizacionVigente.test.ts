import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useCotizacionVigente } from './useCotizacionVigente';

it('la cotización vence sola al superar el instante de vencimiento', async () => {
  vi.useFakeTimers();
  try {
    const limite = Date.now() + 500;
    const { result, unmount } = renderHook(() => useCotizacionVigente(limite));
    expect(result.current).toBe(true);
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(result.current).toBe(true);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(result.current).toBe(false);
    unmount();
  } finally {
    vi.useRealTimers();
  }
});
