import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { cerrarSesion, iniciarSesion } from '../../features/auth';
import { RequireSesion } from './RequireSesion';

const AHORA = Date.now();

function Login() {
  const { state } = useLocation() as { state: { desde?: string } | null };
  return <p>login desde {state?.desde ?? 'ninguna'}</p>;
}

function montar(entrada: string) {
  const router = createMemoryRouter(
    [
      {
        element: <RequireSesion />,
        children: [{ path: '/inicio', element: <p>pantalla privada</p> }],
      },
      { path: '/login', element: <Login /> },
    ],
    { initialEntries: [entrada] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

afterEach(() => {
  cerrarSesion('manual');
  sessionStorage.clear();
});

describe('RequireSesion', () => {
  it('sin sesión redirige a /login con state.desde y no renderiza hijos', () => {
    const router = montar('/inicio?pagina=2');
    expect(router.state.location.pathname).toBe('/login');
    expect(screen.getByText('login desde /inicio?pagina=2')).toBeInTheDocument();
    expect(screen.queryByText('pantalla privada')).toBeNull();
  });

  it('con sesión vigente renderiza la ruta hija', () => {
    iniciarSesion(
      { token: 'token', rol: 'Empleado', expiraEn: new Date(AHORA + 60_000).toISOString() },
      AHORA,
    );
    montar('/inicio');
    expect(screen.getByText('pantalla privada')).toBeInTheDocument();
  });
});
