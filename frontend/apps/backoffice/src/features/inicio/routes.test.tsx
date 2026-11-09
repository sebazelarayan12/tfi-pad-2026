import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { inicioRoutes } from './routes';

describe('inicioRoutes', () => {
  it('el Topbar de Inicio lleva "Nueva cotización" hacia el alta de cotización', () => {
    const handle = inicioRoutes[0]?.handle as { titulo: string; accion: React.ReactNode };
    expect(handle.titulo).toBe('Inicio');

    render(<MemoryRouter>{handle.accion}</MemoryRouter>);

    expect(screen.getByRole('link', { name: 'Nueva cotización' })).toHaveAttribute(
      'href',
      '/cotizaciones/nueva',
    );
  });
});
