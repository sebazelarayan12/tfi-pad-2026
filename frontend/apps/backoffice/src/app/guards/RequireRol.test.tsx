import type { RolUsuario } from '@nexa/api';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { cerrarSesion, iniciarSesion } from '../../features/auth';
import { RequireRol } from './RequireRol';

const AHORA = Date.now();

function conRol(rol: RolUsuario) {
  iniciarSesion({ token: 'token', rol, expiraEn: new Date(AHORA + 60_000).toISOString() }, AHORA);
}

afterEach(() => {
  cerrarSesion('manual');
  sessionStorage.clear();
});

describe('RequireRol', () => {
  it('Administrador accede a una ruta de Administrador', () => {
    conRol('Administrador');
    render(
      <RequireRol roles={['Administrador']}>
        <p>pantalla de administrador</p>
      </RequireRol>,
    );
    expect(screen.getByText('pantalla de administrador')).toBeInTheDocument();
    expect(screen.queryByText('No tenés permiso para esta acción.')).toBeNull();
  });

  it('Empleado no ve los hijos y ve el texto de falta de permiso', () => {
    conRol('Empleado');
    render(
      <RequireRol roles={['Administrador']}>
        <p>pantalla de administrador</p>
      </RequireRol>,
    );
    expect(screen.queryByText('pantalla de administrador')).toBeNull();
    expect(screen.getByText('No tenés permiso para esta acción.')).toBeInTheDocument();
  });

  it('sin sesión no renderiza los hijos', () => {
    render(
      <RequireRol roles={['Administrador', 'Empleado']}>
        <p>pantalla</p>
      </RequireRol>,
    );
    expect(screen.queryByText('pantalla')).toBeNull();
    expect(screen.getByText('No tenés permiso para esta acción.')).toBeInTheDocument();
  });

  it('usado como ruta de layout renderiza la ruta hija', () => {
    conRol('Administrador');
    const router = createMemoryRouter(
      [
        {
          element: <RequireRol roles={['Administrador']} />,
          children: [{ path: '/planes', element: <p>planes</p> }],
        },
      ],
      { initialEntries: ['/planes'] },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByText('planes')).toBeInTheDocument();
  });
});
