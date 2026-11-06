import { ApiClientProvider, createApiClient } from '@nexa/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { cerrarSesion, iniciarSesion } from '../../auth';
import { usuariosRoutes } from '../routes';
import { UsuariosPage } from './UsuariosPage';

function entrarComo(rol: 'Administrador' | 'Empleado') {
  iniciarSesion({
    token: `mock.${btoa(JSON.stringify({ email: 'prueba@example.test' }))}.mock`,
    rol,
    expiraEn: new Date(Date.now() + 60000).toISOString(),
  });
}

function montar() {
  const usuario = userEvent.setup();
  const cliente = createApiClient({ baseUrl: 'https://api.test' });
  const ruta = usuariosRoutes[0];
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ApiClientProvider client={cliente}>
        <MemoryRouter>{ruta?.element}</MemoryRouter>
      </ApiClientProvider>
    </QueryClientProvider>,
  );
  return usuario;
}

afterEach(() => cerrarSesion('manual'));

describe('UsuariosPage', () => {
  it('la_ruta_es_usuarios_con_titulo', () => {
    expect(usuariosRoutes[0]).toMatchObject({ path: '/usuarios', handle: { titulo: 'Usuarios' } });
    expect(UsuariosPage).toBeTypeOf('function');
  });

  it('empleado_no_ve_el_formulario', () => {
    entrarComo('Empleado');
    montar();
    expect(screen.queryByRole('heading', { name: 'Nuevo empleado' })).not.toBeInTheDocument();
    expect(screen.getByText('No tenés permiso para esta acción.')).toBeInTheDocument();
  });

  it('administrador_ve_el_panel', () => {
    entrarComo('Administrador');
    montar();
    expect(screen.getByRole('heading', { name: 'Nuevo empleado' })).toBeInTheDocument();
  });

  it('boton_nuevo_empleado_enfoca_nombre_y_limpia', async () => {
    entrarComo('Administrador');
    const usuario = montar();
    const nombre = screen.getByLabelText('Nombre') as HTMLInputElement;
    await usuario.type(nombre, 'Julieta');
    await usuario.click(screen.getByRole('button', { name: 'Nuevo empleado' }));
    expect(nombre.value).toBe('');
    expect(nombre).toHaveFocus();
  });
});
