import { ApiClientProvider, createApiClient } from '@nexa/api';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import { iniciarSesion, cerrarSesion } from '../../features/auth';
import { rutas } from '../../features/clientes';
import { RequireSesion } from '../guards/RequireSesion';
import { LayoutBackoffice } from './LayoutBackoffice';

afterEach(() => cerrarSesion('manual'));
function montar(autenticado: boolean) {
  if (autenticado)
    iniciarSesion({
      token: 'mock',
      rol: 'Empleado',
      expiraEn: new Date(Date.now() + 3600000).toISOString(),
    });
  const router = createMemoryRouter(
    [
      {
        element: <RequireSesion />,
        children: [{ element: <LayoutBackoffice />, children: rutas }],
      },
      { path: '/login', element: <h1>Ingresar al panel</h1> },
    ],
    { initialEntries: ['/clientes'] },
  );
  const cliente = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'mock' });
  const vista = render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ApiClientProvider>,
  );
  return { ...vista, router };
}
it('B-04 usa la acción del layout, un único h1 y oculta el buscador global', async () => {
  const { container } = montar(true);
  await screen.findByText('2 clientes');
  const titulo = screen.getByRole('heading', { level: 1, name: 'Clientes' });
  const enlace = screen.getByRole('link', { name: 'Nuevo cliente' });
  expect(titulo.closest('header')).toContainElement(enlace);
  expect(enlace).toHaveAttribute('href', '/clientes/nuevo');
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByRole('link', { name: 'Clientes' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  expect(screen.queryByLabelText('Buscar cliente o póliza')).toBeNull();
  expect(screen.getByRole('searchbox', { name: 'Buscar por DNI o apellido' })).toBeInTheDocument();
  await expectSinViolacionesA11y(container);
});
it.each([
  ['Nuevo cliente', 'Nuevo cliente', 'El alta de clientes todavía no está disponible.'],
  ['Juan Carlos Pérez', 'Ficha de cliente', 'La ficha de cliente todavía no está disponible.'],
])('permite volver al listado desde el destino pendiente de %s', async (enlace, titulo, aviso) => {
  const usuario = userEvent.setup();
  montar(true);
  await usuario.click(await screen.findByRole('link', { name: enlace }));

  const encabezado = await screen.findByRole('heading', { level: 1, name: titulo });
  expect(encabezado).toHaveFocus();
  expect(screen.getByText(aviso)).toBeInTheDocument();

  await usuario.click(screen.getByRole('link', { name: 'Volver al listado' }));
  expect(await screen.findByRole('heading', { level: 1, name: 'Clientes' })).toBeInTheDocument();
  expect(await screen.findByText('2 clientes')).toBeInTheDocument();
});

it('sin sesión redirige a login y conserva el destino', async () => {
  const { router } = montar(false);
  await screen.findByRole('heading', { name: 'Ingresar al panel' });
  await waitFor(() => expect(router.state.location.state).toMatchObject({ desde: '/clientes' }));
});
