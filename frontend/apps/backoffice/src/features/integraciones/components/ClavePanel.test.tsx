import {
  ApiClientProvider,
  createApiClient,
  ESTADO_GRUPO,
  type GrupoCuentaResponse,
} from '@nexa/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ClavePanel } from './ClavePanel';

const BASE: GrupoCuentaResponse = {
  id: 'g1',
  nombre: 'Estacionamiento Sur',
  email: 'ana@example.test',
  contacto: 'Ana Pérez',
  descripcion: 'Consultar seguros por patente.',
  estado: ESTADO_GRUPO.Aprobada,
  motivo: null,
  fechaSolicitud: '2026-11-08T15:00:00Z',
  fechaResolucion: '2026-11-09T12:00:00Z',
  tieneClave: false,
  clavePrefijo: null,
  claveCreadaEn: null,
};

function montar(cuenta: GrupoCuentaResponse) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ApiClientProvider client={createApiClient({ baseUrl: 'https://api.test' })}>
        <ClavePanel cuenta={cuenta} />
      </ApiClientProvider>
    </QueryClientProvider>,
  );
}

describe('ClavePanel', () => {
  it('pendiente: informa que está en revisión y no ofrece generar clave', () => {
    montar({ ...BASE, estado: ESTADO_GRUPO.Pendiente });
    expect(screen.getByText('En revisión')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /clave/i })).not.toBeInTheDocument();
  });

  it('rechazada: muestra el motivo y no ofrece generar clave', () => {
    montar({ ...BASE, estado: ESTADO_GRUPO.Rechazada, motivo: 'Datos incompletos' });
    expect(screen.getByText(/Motivo: Datos incompletos/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /clave/i })).not.toBeInTheDocument();
  });

  it('revocada: avisa que la clave dejó de funcionar', () => {
    montar({ ...BASE, estado: ESTADO_GRUPO.Revocada, motivo: 'Uso indebido' });
    expect(screen.getByText(/dejó de funcionar/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /clave/i })).not.toBeInTheDocument();
  });

  it('aprobada sin clave: ofrece generarla', () => {
    montar(BASE);
    expect(screen.getByText('Todavía no generaste tu clave.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generar clave' })).toBeInTheDocument();
  });

  it('aprobada con clave: muestra solo el prefijo y ofrece generar una nueva', () => {
    montar({
      ...BASE,
      tieneClave: true,
      clavePrefijo: 'nxk_abcd',
      claveCreadaEn: '2026-11-10T10:00:00Z',
    });
    expect(screen.getByText('nxk_abcd…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generar clave nueva' })).toBeInTheDocument();
  });
});
