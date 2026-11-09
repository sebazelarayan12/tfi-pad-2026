import {
  ApiClientProvider,
  createApiClient,
  type ActualizarUsuarioMock,
  type UsuarioListItemMock,
} from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { Toaster } from '@nexa/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { EditarUsuarioPanel } from './EditarUsuarioPanel';

const USUARIO: UsuarioListItemMock = {
  id: 'u-1',
  email: 'hernan.sosa@nexaseguros.com.ar',
  nombre: 'Hernán',
  apellido: 'Sosa',
  rol: 'Empleado',
  activo: true,
  ultimoIngreso: null,
};

function capturarPut(respuesta?: () => Response | Promise<Response>) {
  const capturas: ActualizarUsuarioMock[] = [];
  servidorMock.use(
    http.put('*/api/usuarios/:id', async ({ request }) => {
      capturas.push((await request.json()) as ActualizarUsuarioMock);
      return respuesta?.() ?? HttpResponse.json({ ...USUARIO, apellido: 'Paz' });
    }),
  );
  return capturas;
}

function montar(esUltimoAdministrador = false, usuarioEdit: UsuarioListItemMock = USUARIO) {
  const onCerrar = vi.fn();
  const usuario = userEvent.setup();
  const cliente = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'mock' });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ApiClientProvider client={cliente}>
        <EditarUsuarioPanel
          usuario={usuarioEdit}
          esUltimoAdministrador={esUltimoAdministrador}
          onCerrar={onCerrar}
        />
        <Toaster />
      </ApiClientProvider>
    </QueryClientProvider>,
  );
  return { usuario, onCerrar };
}

const campo = (nombre: string) => screen.getByLabelText(nombre) as HTMLInputElement;
const guardar = () => screen.getByRole('button', { name: /Guardar cambios|Guardando/ });

describe('EditarUsuarioPanel', () => {
  it('muestra los valores cargados, el email deshabilitado y ningún campo de contraseña', () => {
    montar();
    expect(screen.getByRole('heading', { name: 'Editar usuario' })).toBeInTheDocument();
    expect(campo('Nombre').value).toBe('Hernán');
    expect(campo('Apellido').value).toBe('Sosa');
    expect(campo('Email').value).toBe(USUARIO.email);
    expect(campo('Email')).toBeDisabled();
    expect(screen.queryByLabelText(/contraseña/i)).toBeNull();
    expect(screen.getByRole('radio', { name: 'Empleado' })).toBeChecked();
  });

  it('Guardar cambios envía un PUT con exactamente nombre, apellido y rol, avisa y cierra', async () => {
    const capturas = capturarPut();
    const { usuario, onCerrar } = montar();
    await usuario.clear(campo('Apellido'));
    await usuario.type(campo('Apellido'), 'Paz');
    await usuario.click(screen.getByRole('radio', { name: 'Administrador' }));
    await usuario.click(guardar());
    await waitFor(() => expect(onCerrar).toHaveBeenCalledTimes(1));
    expect(capturas).toEqual([{ nombre: 'Hernán', apellido: 'Paz', rol: 'Administrador' }]);
    expect(Object.keys(capturas[0] ?? {}).sort()).toEqual(['apellido', 'nombre', 'rol']);
    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument();
  });

  it('un nombre vacío no envía el PUT y marca el campo', async () => {
    const capturas = capturarPut();
    const { usuario } = montar();
    await usuario.clear(campo('Nombre'));
    await usuario.click(guardar());
    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument();
    expect(capturas).toHaveLength(0);
  });

  it('un 400 con errors muestra el texto en español bajo el campo, sin el texto en inglés del back', async () => {
    capturarPut(() =>
      HttpResponse.json(
        { status: 400, title: 'Error', errors: { Apellido: ['The Apellido field is required.'] } },
        { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    );
    const { usuario, onCerrar } = montar();
    await usuario.click(guardar());
    expect(await screen.findByText('El apellido es obligatorio.')).toBeInTheDocument();
    expect(screen.queryByText(/field is required/)).toBeNull();
    expect(onCerrar).not.toHaveBeenCalled();
  });

  it('un 400 con detail se avisa con un toast y deja el panel abierto', async () => {
    capturarPut(() =>
      HttpResponse.json(
        { status: 400, title: 'Error', detail: 'No se puede modificar este usuario.' },
        { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    );
    const { usuario, onCerrar } = montar();
    await usuario.click(guardar());
    expect(await screen.findByText('No se puede modificar este usuario.')).toBeInTheDocument();
    expect(onCerrar).not.toHaveBeenCalled();
  });

  it('un doble clic envía un solo PUT y el botón queda deshabilitado mientras corre', async () => {
    const capturas = capturarPut(async () => {
      await delay(50);
      return HttpResponse.json(USUARIO);
    });
    const { usuario } = montar();
    await usuario.dblClick(guardar());
    await waitFor(() => expect(guardar()).toBeDisabled());
    await waitFor(() => expect(capturas).toHaveLength(1));
    expect(capturas).toHaveLength(1);
  });

  it('Cancelar cierra sin enviar', async () => {
    const capturas = capturarPut();
    const { usuario, onCerrar } = montar();
    await usuario.clear(campo('Nombre'));
    await usuario.type(campo('Nombre'), 'Otro');
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
    expect(capturas).toHaveLength(0);
  });

  it('el último administrador activo no puede pasar a Empleado (D-B25-02)', async () => {
    const capturas = capturarPut();
    const { usuario, onCerrar } = montar(true, { ...USUARIO, rol: 'Administrador' });
    await usuario.click(screen.getByRole('radio', { name: 'Empleado' }));
    await usuario.click(guardar());
    expect(
      await screen.findByText('Debe quedar al menos un administrador activo.'),
    ).toBeInTheDocument();
    expect(capturas).toHaveLength(0);
    expect(onCerrar).not.toHaveBeenCalled();
  });

  it('el último administrador sí puede editar su nombre manteniendo el rol', async () => {
    const capturas = capturarPut();
    const { usuario, onCerrar } = montar(true, { ...USUARIO, rol: 'Administrador' });
    await usuario.clear(campo('Apellido'));
    await usuario.type(campo('Apellido'), 'Paz');
    await usuario.click(guardar());
    await waitFor(() => expect(onCerrar).toHaveBeenCalled());
    expect(capturas[0]).toMatchObject({ apellido: 'Paz', rol: 'Administrador' });
  });
});
