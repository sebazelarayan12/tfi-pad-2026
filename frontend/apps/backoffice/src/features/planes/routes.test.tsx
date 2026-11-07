import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import { cerrarSesion, iniciarSesion } from '../auth';
import { planesRoutes } from './routes';

afterEach(() => cerrarSesion('manual'));

it('deniega la página a un empleado sin cambiar la URL', () => {
  iniciarSesion({
    token: 'mock.token.test',
    rol: 'Empleado',
    expiraEn: new Date(Date.now() + 60000).toISOString(),
  });
  const router = createMemoryRouter(planesRoutes, { initialEntries: ['/planes'] });
  render(<RouterProvider router={router} />);
  expect(screen.getByText('No tenés permiso para esta acción.')).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: /Editar plan/ })).not.toBeInTheDocument();
  expect(router.state.location.pathname).toBe('/planes');
});
