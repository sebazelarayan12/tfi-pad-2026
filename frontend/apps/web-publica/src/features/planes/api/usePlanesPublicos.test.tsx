import { ApiClientProvider, createApiClient, planesKeys } from '@nexa/api';
import { planesError500 } from '@nexa/api/mocks/handlers/planes';
import { servidorMock } from '@nexa/api/mocks/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { usePlanesPublicos } from './usePlanesPublicos';

beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
afterEach(() => servidorMock.resetHandlers());
afterAll(() => servidorMock.close());

function crearEntorno() {
  // Con el default de TanStack (3 reintentos) se nota si el hook no apaga el reintento.
  const queryClient = new QueryClient();
  const cliente = createApiClient({ baseUrl: 'http://localhost' });
  function Envoltorio({ children }: { children: ReactNode }) {
    return (
      <ApiClientProvider client={cliente}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiClientProvider>
    );
  }
  return { queryClient, Envoltorio };
}

describe('usePlanesPublicos', () => {
  it('usa planesKeys.lista() como query key', async () => {
    const { queryClient, Envoltorio } = crearEntorno();
    const { result } = renderHook(() => usePlanesPublicos(), { wrapper: Envoltorio });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(planesKeys.lista())).toEqual(result.current.data);
    expect(result.current.data?.map((plan) => plan.codigo)).toEqual(['RC', 'TC', 'TR']);
  });

  it('la query no reintenta sola', async () => {
    servidorMock.use(planesError500);
    let pedidos = 0;
    const contar = () => {
      pedidos += 1;
    };
    servidorMock.events.on('request:start', contar);
    const { Envoltorio } = crearEntorno();

    const { result } = renderHook(() => usePlanesPublicos(), { wrapper: Envoltorio });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.failureCount).toBe(1);
    expect(pedidos).toBe(1);
    servidorMock.events.removeListener('request:start', contar);
  });
});
