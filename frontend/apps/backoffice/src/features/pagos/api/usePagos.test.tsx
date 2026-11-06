import {
  ApiClientProvider,
  pagosKeys,
  polizasKeys,
  type ApiClient,
  type PagoCajaRequest,
} from '@nexa/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { servidorMock } from '@nexa/api/mocks/server';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { crearClientePrueba, crearQueryClientPrueba, PAGO_APROBADO } from '../test/utils';
import { useCobrarCuotas } from './usePagos';

function crearWrapper(api: ApiClient, queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ApiClientProvider client={api}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiClientProvider>
    );
  };
}

describe('useCobrarCuotas', () => {
  it('no reintenta el POST aunque el QueryClient tenga reintentos', async () => {
    const post = vi.fn();
    servidorMock.use(
      http.post('*/api/pagos/caja', () => {
        post();
        return HttpResponse.json({ title: 'Bad Gateway' }, { status: 503 });
      }),
    );
    const api = crearClientePrueba();
    const queryClient = crearQueryClientPrueba({ retryMutaciones: 2 });
    const { result } = renderHook(() => useCobrarCuotas(), {
      wrapper: crearWrapper(api, queryClient),
    });

    act(() => result.current.mutate({ cuotaIds: ['cuota-1'] }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('invalida pólizas y pagos al confirmar el cobro', async () => {
    servidorMock.use(
      http.post('*/api/pagos/caja', async ({ request }) => {
        const body = (await request.json()) as PagoCajaRequest;
        expect(body).toEqual({ cuotaIds: ['cuota-1'] });
        return HttpResponse.json(PAGO_APROBADO, { status: 201 });
      }),
    );
    const api = crearClientePrueba();
    const queryClient = crearQueryClientPrueba();
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCobrarCuotas('poliza-1'), {
      wrapper: crearWrapper(api, queryClient),
    });

    act(() => result.current.mutate({ cuotaIds: ['cuota-1'] }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => {
      expect(invalidar).toHaveBeenCalledWith({ queryKey: polizasKeys.all });
      expect(invalidar).toHaveBeenCalledWith({ queryKey: pagosKeys.all });
      expect(invalidar).toHaveBeenCalledWith({ queryKey: polizasKeys.cuotas('poliza-1') });
    });
  });
});
