import { useApiClient } from '@nexa/api';
import { useQueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { apiClient } from './apiClient';
import { Providers } from './providers';
import { queryClient } from './queryClient';

function Cliente() {
  const cliente = useQueryClient();
  return <p>{cliente === queryClient ? 'cliente de la app' : 'otro cliente'}</p>;
}

function ClienteHttp() {
  const cliente = useApiClient();
  return <p>{cliente === apiClient ? 'cliente http de la app' : 'otro cliente http'}</p>;
}

describe('queryClient', () => {
  it('las mutaciones no reintentan', () => {
    expect(queryClient.getDefaultOptions().mutations?.retry).toBe(0);
  });

  it('las consultas reintentan una vez', () => {
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(1);
  });
});

describe('Providers', () => {
  it('entrega el QueryClient de la app a sus hijos', () => {
    render(
      <Providers>
        <Cliente />
      </Providers>,
    );
    expect(screen.getByText('cliente de la app')).toBeInTheDocument();
  });

  it('entrega el cliente HTTP de la app a sus hijos', () => {
    render(
      <Providers>
        <ClienteHttp />
      </Providers>,
    );
    expect(screen.getByText('cliente http de la app')).toBeInTheDocument();
  });
});
