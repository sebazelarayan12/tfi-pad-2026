import { ApiClientProvider, createApiClient } from '@nexa/api';
import { reiniciarGruposMock } from '@nexa/api/mocks/handlers/grupos';
import { Toaster } from '@nexa/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cerrarSesion, iniciarSesion } from '../../auth';
import { GruposPage } from './GruposPage';

function entrarComo(rol: 'Administrador' | 'Empleado') {
  iniciarSesion({
    token: `mock.${btoa(JSON.stringify({ email: 'prueba@example.test' }))}.mock`,
    rol,
    expiraEn: new Date(Date.now() + 60000).toISOString(),
  });
}

function montar() {
  const usuario = userEvent.setup();
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: 0 } } })}>
      <ApiClientProvider client={createApiClient({ baseUrl: 'https://api.test' })}>
        <MemoryRouter>
          <GruposPage />
        </MemoryRouter>
        <Toaster />
      </ApiClientProvider>
    </QueryClientProvider>,
  );
  return usuario;
}

beforeEach(() => reiniciarGruposMock());
afterEach(() => cerrarSesion('manual'));

describe('GruposPage', () => {
  it('el empleado no ve la gestión de grupos', () => {
    entrarComo('Empleado');
    montar();
    expect(screen.getByText('No tenés permiso para esta acción.')).toBeInTheDocument();
  });

  it('el administrador ve las solicitudes con sus acciones', async () => {
    entrarComo('Administrador');
    montar();
    expect(await screen.findByText('Seguros del Norte')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Revocar' })).toBeInTheDocument();
  });

  it('aprobar una solicitud pendiente avisa y refresca el estado', async () => {
    entrarComo('Administrador');
    const usuario = montar();
    await screen.findByText('Seguros del Norte');
    await usuario.click(screen.getByRole('button', { name: 'Aprobar' }));
    expect(await screen.findByText('Grupo aprobado.')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument(),
    );
  });

  it('rechazar exige el motivo antes de enviar', async () => {
    entrarComo('Administrador');
    const usuario = montar();
    await screen.findByText('Seguros del Norte');
    await usuario.click(screen.getByRole('button', { name: 'Rechazar' }));
    await usuario.click(screen.getByRole('button', { name: 'Rechazar solicitud' }));
    expect(screen.getByText('Escribí el motivo: el grupo lo va a leer.')).toBeInTheDocument();

    await usuario.type(screen.getByLabelText('Motivo'), 'Datos incompletos');
    await usuario.click(screen.getByRole('button', { name: 'Rechazar solicitud' }));
    expect(await screen.findByText('Solicitud rechazada.')).toBeInTheDocument();
  });
});
