import { QueryClient } from '@tanstack/react-query';

/**
 * Defaults de la ficha T-17 §13: consultas con 1 reintento y mutaciones sin reintento (FC11).
 * Las pantallas que llaman a `/api/publico/*` desactivan el reintento de su consulta (FC13).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: { retry: 0 },
    queries: { retry: 1 },
  },
});
