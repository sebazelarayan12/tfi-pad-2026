import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { inicioRoutes } from './routes';

describe('inicioRoutes', () => {
  it('el Topbar de Inicio lleva "Nueva cotización" deshabilitado', () => {
    const handle = inicioRoutes[0]?.handle as { titulo: string; accion: React.ReactNode };
    expect(handle.titulo).toBe('Inicio');

    render(<>{handle.accion}</>);

    expect(screen.getByRole('button', { name: 'Nueva cotización' })).toBeDisabled();
  });
});
