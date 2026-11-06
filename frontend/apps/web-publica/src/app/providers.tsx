import { ApiClientProvider } from '@nexa/api';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { apiClient } from './apiClient';
import { queryClient } from './queryClient';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApiClientProvider client={apiClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApiClientProvider>
  );
}
