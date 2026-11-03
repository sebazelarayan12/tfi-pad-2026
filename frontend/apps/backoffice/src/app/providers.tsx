import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';

import { queryClient } from './queryClient';
import { router } from './router';

// bloque de sesión: US-FE-T-13 (cableado del 401 global)

/** `RouterProvider` va dentro de `QueryClientProvider` para poder usar TanStack Query en el layout. */
export function ProveedoresApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
