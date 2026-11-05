import { ApiError } from '@nexa/api';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProveedoresApp } from './providers';
import { queryClient, reintentarConsulta } from './queryClient';

function errorHttp(status: number): ApiError {
  return new ApiError({ status, kind: 'http' });
}

describe('queryClient', () => {
  it('las mutaciones no se reintentan', () => {
    expect(queryClient.getDefaultOptions().mutations?.retry).toBe(0);
  });

  it('reintentarConsulta no reintenta un error 404', () => {
    expect(reintentarConsulta(0, errorHttp(404))).toBe(false);
  });

  it('reintentarConsulta no reintenta un error 429', () => {
    expect(reintentarConsulta(0, errorHttp(429))).toBe(false);
  });

  it('reintentarConsulta reintenta un error 503 hasta 2 veces', () => {
    const error = errorHttp(503);
    expect(reintentarConsulta(0, error)).toBe(true);
    expect(reintentarConsulta(1, error)).toBe(true);
    expect(reintentarConsulta(2, error)).toBe(false);
  });

  it('reintentarConsulta reintenta un error de red hasta 2 veces', () => {
    const error = new ApiError({ status: 0, kind: 'red' });
    expect(reintentarConsulta(1, error)).toBe(true);
    expect(reintentarConsulta(2, error)).toBe(false);
  });

  it('reintentarConsulta reintenta un error que no es de la API', () => {
    expect(reintentarConsulta(0, new Error('boom'))).toBe(true);
    expect(reintentarConsulta(2, new Error('boom'))).toBe(false);
  });
});

describe('ProveedoresApp', () => {
  it('renderiza el login al abrir el backoffice sin sesión', async () => {
    render(<ProveedoresApp />);
    expect(await screen.findByRole('heading', { name: 'Ingresar al panel' })).toBeInTheDocument();
  });
});
