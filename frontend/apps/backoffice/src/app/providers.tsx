import { ApiClientProvider } from '@nexa/api';
import { Toaster } from '@nexa/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';

import { alCerrarSesion } from '../features/auth';
import { apiClient } from './apiClient';
import { queryClient } from './queryClient';
import { router } from './router';

// bloque de sesión: US-FE-T-13. Al cerrar sesión se vacía la caché para que el siguiente usuario
// no vea datos del anterior (DP-5). El 401 global está en `apiClient.ts`.
alCerrarSesion(() => queryClient.clear());

/** `RouterProvider` va dentro de `QueryClientProvider` para poder usar TanStack Query en el layout. */
export function ProveedoresApp() {
  return (
    <ApiClientProvider client={apiClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ApiClientProvider>
  );
}
