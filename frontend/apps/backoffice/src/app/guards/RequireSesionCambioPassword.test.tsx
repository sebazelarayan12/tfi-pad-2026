import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { cerrarSesion, iniciarSesion } from '../../features/auth';
import { RequireSesion } from './RequireSesion';

const AHORA = Date.now();

function abrirSesion(debeCambiarPassword?: boolean) {
  iniciarSesion(
    {
      token: 'token',
      rol: 'Empleado',
      expiraEn: new Date(AHORA + 60_000).toISOString(),
      ...(debeCambiarPassword === undefined ? {} : { debeCambiarPassword }),
    },
    AHORA,
  );
}

function montar(entrada: string) {
  const router = createMemoryRouter(
    [
      {
        element: <RequireSesion />,
        children: [
          { path: '/inicio', element: <p>pantalla privada</p> },
          { path: '/clientes', element: <p>clientes</p> },
          { path: '/cambiar-password', element: <p>cambio de contraseña</p> },
        ],
      },
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

describe('RequireSesion con cambio de contraseña pendiente', () => {
  it.each(['/inicio', '/clientes'])('con_bandera_redirige_a_cambiar_password desde %s', (ruta) => {
    abrirSesion(true);
    const router = montar(ruta);
    expect(router.state.location.pathname).toBe('/cambiar-password');
    expect(screen.getByText('cambio de contraseña')).toBeInTheDocument();
    expect(screen.queryByText('pantalla privada')).toBeNull();
  });

  it('con_bandera_deja_ver_cambiar_password', () => {
    abrirSesion(true);
    montar('/cambiar-password');
    expect(screen.getByText('cambio de contraseña')).toBeInTheDocument();
  });

  it('en_cambiar_password_sin_bandera_redirige_a_inicio', () => {
    abrirSesion(false);
    const router = montar('/cambiar-password');
    expect(router.state.location.pathname).toBe('/inicio');
  });

  it('bandera_ausente_se_trata_como_false', () => {
    abrirSesion();
    montar('/inicio');
    expect(screen.getByText('pantalla privada')).toBeInTheDocument();
  });
});
