import { useQueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Providers } from './providers';
import { queryClient } from './queryClient';

function Cliente() {
  const cliente = useQueryClient();
  return <p>{cliente === queryClient ? 'cliente de la app' : 'otro cliente'}</p>;
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
});
