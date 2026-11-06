import { createContext, useContext, type ReactNode } from 'react';
import type { ApiClient } from './createApiClient';

const ApiClientContext = createContext<ApiClient | null>(null);

export interface ApiClientProviderProps {
  client: ApiClient;
  children: ReactNode;
}

/** Inyecta el cliente HTTP de la app. Cada app lo monta en su `app/providers.tsx` (FC18). */
export function ApiClientProvider({ client, children }: ApiClientProviderProps) {
  return <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>;
}

/** Devuelve el cliente HTTP del provider más cercano. Falla si no hay provider montado. */
export function useApiClient(): ApiClient {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error('useApiClient debe usarse dentro de un ApiClientProvider.');
  }
  return client;
}
