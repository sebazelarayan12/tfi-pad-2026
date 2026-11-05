import { ApiClientProvider, createApiClient } from '@nexa/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

export function proveedoresRendicion() {
  const cliente = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'mock-empleado' });
  const queryClient = new QueryClient();

  function wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <ApiClientProvider client={cliente}>{children}</ApiClientProvider>
      </QueryClientProvider>
    );
  }

  return { wrapper, queryClient };
}
