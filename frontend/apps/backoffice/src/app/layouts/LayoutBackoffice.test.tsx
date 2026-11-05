import type { RolUsuario } from '@nexa/api';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { cerrarSesion, iniciarSesion, sesionActual } from '../../features/auth';
import { LayoutBackoffice } from './LayoutBackoffice';
import type { HandleRuta } from './navegacionBackoffice';

const AHORA = Date.now();

function jwt(payload: object): string {
  const base64Url = (valor: object) => btoa(JSON.stringify(valor)).replace(/=+$/, '');
  return `${base64Url({ alg: 'none' })}.${base64Url(payload)}.firma`;
}

function conSesion(rol: RolUsuario, email = 'ana@nexa.com') {
  iniciarSesion(
    { token: jwt({ email }), rol, expiraEn: new Date(AHORA + 60_000).toISOString() },
    AHORA,
  );
}

function renderizar(ruta = '/clientes') {
  const router = createMemoryRouter(
    [
      {
        element: <LayoutBackoffice />,
        children: [
          { path: '/clientes', handle: { titulo: 'Clientes' } satisfies HandleRuta, element: <p>contenido clientes</p> },
          { path: '/sin-titulo', element: <p>contenido sin título</p> },
        ],
      },
      { path: '/login', element: <p>pantalla de login</p> },
    ],
    { initialEntries: [ruta] },
  );
  const vista = render(<RouterProvider router={router} />);
  return { router, ...vista };
}

afterEach(() => {
  cerrarSesion('manual');
  sessionStorage.clear();
});

describe('LayoutBackoffice', () => {
  it('Empleado no ve Planes ni Usuarios', () => {
    conSesion('Empleado');
    renderizar();
    expect(screen.getByText('Clientes', { selector: 'a, span' })).toBeInTheDocument();
    expect(screen.queryByText('Planes')).toBeNull();
    expect(screen.queryByText('Usuarios')).toBeNull();
  });

  it('Administrador ve Planes y Usuarios', () => {
    conSesion('Administrador');
    renderizar();
    expect(screen.getByText('Planes')).toBeInTheDocument();
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
  });

  it('muestra el título de la ruta y el contenido en main', () => {
    conSesion('Empleado');
    renderizar();
    expect(screen.getByRole('heading', { level: 2, name: 'Clientes' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('contenido clientes');
  });

  it('una ruta sin handle no muestra título', () => {
    conSesion('Empleado');
    renderizar('/sin-titulo');
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    expect(screen.getByRole('main')).toHaveTextContent('contenido sin título');
  });

  it('muestra email, rol e inicial del usuario', () => {
    conSesion('Administrador', 'ana@nexa.com');
    renderizar();
    expect(screen.getByText('ana@nexa.com')).toBeInTheDocument();
    expect(screen.getByText('Administrador', { selector: 'p, span, div' })).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('el menú de usuario tiene nombre accesible y se cierra con Escape devolviendo el foco', async () => {
    conSesion('Empleado');
    renderizar();
    const boton = screen.getByRole('button', { name: 'Menú de usuario' });
    await userEvent.click(boton);
    expect(screen.getByRole('menuitem', { name: 'Cerrar sesión' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menuitem', { name: 'Cerrar sesión' })).toBeNull();
    expect(boton).toHaveFocus();
  });

  it('Cerrar sesión limpia la sesión y reemplaza la ruta por /login', async () => {
    conSesion('Empleado');
    const { router } = renderizar();
    await userEvent.click(screen.getByRole('button', { name: 'Menú de usuario' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }));
    expect(sesionActual()).toBeNull();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.historyAction).toBe('REPLACE');
    expect(screen.getByText('pantalla de login')).toBeInTheDocument();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    conSesion('Administrador');
    const { container } = renderizar();
    await expectSinViolacionesA11y(container);
  });
});
