// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ApiClientProvider, createApiClient, useApiClient } from '@nexa/api';

describe('ApiClientProvider / useApiClient', () => {
  it('devuelve el cliente que recibió el provider', () => {
    const client = createApiClient({ baseUrl: 'https://api.test' });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ApiClientProvider client={client}>{children}</ApiClientProvider>
    );

    const { result } = renderHook(() => useApiClient(), { wrapper });

    expect(result.current).toBe(client);
  });

  it('falla con un mensaje claro si no hay provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useApiClient())).toThrow(
      'useApiClient debe usarse dentro de un ApiClientProvider.',
    );
  });
});
