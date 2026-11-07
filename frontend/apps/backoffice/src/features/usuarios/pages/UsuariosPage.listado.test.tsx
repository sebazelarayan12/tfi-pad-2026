import { ApiClientProvider, createApiClient, type UsuarioListItemMock } from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { Toaster } from '@nexa/ui';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { cerrarSesion, iniciarSesion } from '../../auth';
import { UsuariosPage } from './UsuariosPage';

const lista = '*/api/usuarios';

function usuarioDe(id: string, parcial: Partial<UsuarioListItemMock>): UsuarioListItemMock {
  return {
    id,
    email: `${id}@example.test`,
    nombre: 'Nombre',
    apellido: 'Apellido',
    rol: 'Empleado',
    activo: true,
    ultimoIngreso: null,
    ...parcial,
  };
}

const HERNAN = usuarioDe('hernan', { nombre: 'Hernán', apellido: 'Sosa', rol: 'Administrador' });
const MARIELA = usuarioDe('mariela', { nombre: 'Mariela', apellido: 'Quiroga' });
const AGUSTINA = usuarioDe('agustina', { nombre: 'Agustina', apellido: 'Paz', activo: false });
const OTRO_ADMIN = usuarioDe('natalia', {
  nombre: 'Natalia',
  apellido: 'Ferreyra',
  rol: 'Administrador',
});

function entrarComo(email: string) {
  iniciarSesion({
    token: `mock.${btoa(JSON.stringify({ email }))}.mock`,
    rol: 'Administrador',
    expiraEn: new Date(Date.now() + 60000).toISOString(),
  });
}

/** Servidor de usuarios con estado propio: registra las requests y refleja los cambios en la lista. */
function usarUsuarios(inicial: UsuarioListItemMock[]) {
  const usuarios = inicial.map((u) => ({ ...u }));
  const pedidos = { lista: [] as string[], patch: [] as unknown[], put: [] as unknown[] };
  servidorMock.use(
    http.get(lista, ({ request }) => {
      pedidos.lista.push(new URL(request.url).search);
      return HttpResponse.json({
        items: usuarios,
        pagina: 1,
        tamanoPagina: 100,
        total: usuarios.length,
      });
    }),
    http.patch(`${lista}/:id/activo`, async ({ request, params }) => {
      const body = (await request.json()) as { activo: boolean };
      pedidos.patch.push(body);
      await delay(30);
      const usuario = usuarios.find((u) => u.id === params.id);
      if (!usuario) {
        return HttpResponse.json(
          { status: 404, title: 'No encontrado', detail: 'El usuario no existe.' },
          { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
        );
      }
      usuario.activo = body.activo;
      return HttpResponse.json(usuario);
    }),
    http.put(`${lista}/:id`, async ({ request, params }) => {
      const body = (await request.json()) as Partial<UsuarioListItemMock>;
      pedidos.put.push(body);
      const usuario = usuarios.find((u) => u.id === params.id);
      Object.assign(usuario ?? {}, body);
      return HttpResponse.json(usuario);
    }),
  );
  return { usuarios, pedidos };
}

function montar() {
  const usuario = userEvent.setup();
  const cliente = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'mock' });
  const vista = render(
    <QueryClientProvider client={new QueryClient()}>
      <ApiClientProvider client={cliente}>
        <MemoryRouter>
          <UsuariosPage />
        </MemoryRouter>
        <Toaster />
      </ApiClientProvider>
    </QueryClientProvider>,
  );
  return { usuario, ...vista };
}

const fila = (nombre: RegExp) => screen.findByRole('row', { name: nombre });
const abrirMenu = async (usuario: ReturnType<typeof userEvent.setup>, nombre: string) =>
  usuario.click(await screen.findByRole('button', { name: `Acciones de ${nombre}` }));

afterEach(() => cerrarSesion('manual'));

describe('UsuariosPage: listado, edición y activación', () => {
  it('pide la lista con pagina=1 y tamano=100 y la muestra', async () => {
    entrarComo('admin@example.test');
    const { pedidos } = usarUsuarios([HERNAN, MARIELA]);
    montar();
    expect(await fila(/Hernán Sosa/)).toBeInTheDocument();
    expect(await fila(/Mariela Quiroga/)).toBeInTheDocument();
    const consulta = new URLSearchParams(pedidos.lista[0]);
    expect(consulta.get('pagina')).toBe('1');
    expect(consulta.get('tamano')).toBe('100');
  });

  it('Editar reemplaza el panel de alta; guardar refresca la tabla y vuelve al alta', async () => {
    entrarComo('admin@example.test');
    const { pedidos } = usarUsuarios([HERNAN, MARIELA]);
    const { usuario } = montar();
    await abrirMenu(usuario, 'Mariela Quiroga');
    await usuario.click(screen.getByRole('menuitem', { name: 'Editar' }));
    expect(screen.getByRole('heading', { name: 'Editar usuario' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Nuevo empleado' })).toBeNull();

    const apellido = screen.getByLabelText('Apellido');
    await usuario.clear(apellido);
    await usuario.type(apellido, 'Robles');
    await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await fila(/Mariela Robles/)).toBeInTheDocument();
    expect(pedidos.put).toEqual([{ nombre: 'Mariela', apellido: 'Robles', rol: 'Empleado' }]);
    expect(pedidos.lista.length).toBeGreaterThanOrEqual(2);
    expect(await screen.findByRole('heading', { name: 'Nuevo empleado' })).toBeInTheDocument();
  });

  it('Cancelar la edición vuelve al panel de alta sin enviar', async () => {
    entrarComo('admin@example.test');
    const { pedidos } = usarUsuarios([HERNAN, MARIELA]);
    const { usuario } = montar();
    await abrirMenu(usuario, 'Mariela Quiroga');
    await usuario.click(screen.getByRole('menuitem', { name: 'Editar' }));
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('heading', { name: 'Nuevo empleado' })).toBeInTheDocument();
    expect(pedidos.put).toHaveLength(0);
  });

  it('Desactivar abre el diálogo con foco en Cancelar; Cancelar no envía el PATCH', async () => {
    entrarComo('admin@example.test');
    const { pedidos } = usarUsuarios([HERNAN, MARIELA]);
    const { usuario } = montar();
    await abrirMenu(usuario, 'Mariela Quiroga');
    await usuario.click(screen.getByRole('menuitem', { name: 'Desactivar' }));
    const dialogo = screen.getByRole('alertdialog', { name: 'Desactivar a Mariela Quiroga' });
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(pedidos.patch).toHaveLength(0);
  });

  it('Escape cierra el diálogo sin enviar', async () => {
    entrarComo('admin@example.test');
    const { pedidos } = usarUsuarios([HERNAN, MARIELA]);
    const { usuario } = montar();
    await abrirMenu(usuario, 'Mariela Quiroga');
    await usuario.click(screen.getByRole('menuitem', { name: 'Desactivar' }));
    await usuario.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(pedidos.patch).toHaveLength(0);
  });

  it('confirmar envía un solo PATCH { activo: false } y la fila pasa a Inactivo', async () => {
    entrarComo('admin@example.test');
    const { pedidos } = usarUsuarios([HERNAN, MARIELA]);
    const { usuario } = montar();
    await abrirMenu(usuario, 'Mariela Quiroga');
    await usuario.click(screen.getByRole('menuitem', { name: 'Desactivar' }));
    await usuario.dblClick(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Desactivar' }),
    );
    const mariela = await fila(/Mariela Quiroga/);
    await waitFor(() => expect(within(mariela).getByText('Inactivo')).toBeInTheDocument());
    expect(pedidos.patch).toEqual([{ activo: false }]);
    expect(await screen.findByText('Usuario actualizado.')).toBeInTheDocument();
  });

  it('Activar envía { activo: true } sin diálogo y la fila pasa a Activo', async () => {
    entrarComo('admin@example.test');
    const { pedidos } = usarUsuarios([HERNAN, AGUSTINA]);
    const { usuario } = montar();
    await abrirMenu(usuario, 'Agustina Paz');
    await usuario.click(screen.getByRole('menuitem', { name: 'Activar' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    const agustina = await fila(/Agustina Paz/);
    await waitFor(() => expect(within(agustina).getByText('Activo')).toBeInTheDocument());
    expect(pedidos.patch).toEqual([{ activo: true }]);
  });

  it('un 404 del PATCH muestra el detail y refresca la lista', async () => {
    entrarComo('admin@example.test');
    const { usuarios, pedidos } = usarUsuarios([HERNAN, MARIELA]);
    const { usuario } = montar();
    await abrirMenu(usuario, 'Mariela Quiroga');
    usuarios.splice(1, 1); // El usuario dejó de existir en el servidor.
    await usuario.click(screen.getByRole('menuitem', { name: 'Desactivar' }));
    await usuario.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Desactivar' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('El usuario no existe.');
    await waitFor(() => expect(screen.queryByRole('row', { name: /Mariela Quiroga/ })).toBeNull());
    expect(pedidos.lista.length).toBeGreaterThanOrEqual(2);
  });

  it('no deja desactivar la propia cuenta (D-B25-02)', async () => {
    entrarComo(OTRO_ADMIN.email);
    const { pedidos } = usarUsuarios([HERNAN, OTRO_ADMIN]);
    const { usuario } = montar();
    await abrirMenu(usuario, 'Natalia Ferreyra');
    const desactivar = screen.getByRole('menuitem', { name: 'Desactivar' });
    expect(desactivar).toHaveAttribute('aria-disabled', 'true');
    expect(desactivar).toHaveAccessibleDescription('No podés desactivar tu propia cuenta.');
    await usuario.click(desactivar);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(pedidos.patch).toHaveLength(0);
  });

  it('no deja desactivar al último administrador activo, pero sí a otro administrador si hay dos', async () => {
    entrarComo('mariela@example.test');
    usarUsuarios([HERNAN, MARIELA]);
    const { usuario, unmount } = montar();
    await abrirMenu(usuario, 'Hernán Sosa');
    expect(screen.getByRole('menuitem', { name: 'Desactivar' })).toHaveAccessibleDescription(
      'Debe quedar al menos un administrador activo.',
    );
    unmount();

    usarUsuarios([HERNAN, OTRO_ADMIN, MARIELA]);
    const segundo = montar();
    await abrirMenu(segundo.usuario, 'Hernán Sosa');
    expect(screen.getByRole('menuitem', { name: 'Desactivar' })).not.toHaveAttribute(
      'aria-disabled',
    );
  });

  it('error al cargar la lista y lista vacía', async () => {
    entrarComo('admin@example.test');
    servidorMock.use(
      http.get(lista, () =>
        HttpResponse.json(
          { status: 500, title: 'Error', detail: 'Falla interna.' },
          { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );
    const error = montar();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar los usuarios. Falla interna.',
    );
    error.unmount();

    usarUsuarios([]);
    montar();
    expect(await screen.findByText('No hay usuarios.')).toBeInTheDocument();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    entrarComo('admin@example.test');
    usarUsuarios([HERNAN, MARIELA, AGUSTINA]);
    const { container } = montar();
    await fila(/Mariela Quiroga/);
    await expectSinViolacionesA11y(container);
  });
});
