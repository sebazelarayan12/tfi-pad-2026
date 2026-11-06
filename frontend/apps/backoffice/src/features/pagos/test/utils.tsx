import {
  ApiClientProvider,
  createApiClient,
  ESTADO_CUOTA_NUMERO,
  type ApiClient,
  type FacturaResponse,
  type PagoResponse,
} from '@nexa/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import type { CuotaCobrable } from '../types/cobro';

export const BASE_URL_PRUEBA = 'http://api.test';

export const FACTURA_AUTORIZADA: FacturaResponse = {
  id: 'factura-1',
  pagoId: 'pago-1',
  numero: '0001-00000123',
  tipo: 'B',
  importe: 51250,
  estado: 'AUTORIZADA',
  cae: '74123456789012',
  vencimientoCae: '2026-11-18',
  fechaEmision: '2026-10-30T20:00:00Z',
};

export const PAGO_APROBADO: PagoResponse = {
  id: 'pago-1',
  clienteId: 'cliente-1',
  numero: 'PAG-6f1c2a',
  estado: 'APROBADO',
  medio: 'CAJA',
  importe: 51250,
  fechaCreacion: '2026-10-30T20:00:00Z',
  fechaAcreditacion: '2026-10-30T20:00:00Z',
  factura: FACTURA_AUTORIZADA,
};

export function pagoConFacturaPendiente(importe: number): PagoResponse {
  return {
    ...PAGO_APROBADO,
    importe,
    factura: {
      ...FACTURA_AUTORIZADA,
      numero: '',
      importe,
      estado: 'PENDIENTE_CAE',
      cae: null,
      vencimientoCae: null,
    },
  };
}

export function cuota(numero: number, overrides: Partial<CuotaCobrable> = {}): CuotaCobrable {
  return {
    id: `cuota-${numero}`,
    numero,
    importe: 10500,
    recargo: 0,
    estado: ESTADO_CUOTA_NUMERO.Pendiente,
    fechaVencimiento: '2026-10-10',
    ...overrides,
  };
}

export function crearClientePrueba(): ApiClient {
  return createApiClient({
    baseUrl: BASE_URL_PRUEBA,
    getToken: () => 'token-de-prueba',
  });
}

export function crearQueryClientPrueba(
  opciones: { retryMutaciones?: number; retryConsultas?: number | false } = {},
): QueryClient {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: opciones.retryMutaciones ?? 0 },
      queries: { retry: opciones.retryConsultas ?? false },
    },
  });
}

interface OpcionesRender extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  api?: ApiClient;
}

export function renderConProveedores(ui: ReactElement, opciones: OpcionesRender = {}) {
  const { queryClient = crearQueryClientPrueba(), api = crearClientePrueba(), ...resto } = opciones;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ApiClientProvider client={api}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiClientProvider>
    );
  }

  return { queryClient, api, ...render(ui, { wrapper: Wrapper, ...resto }) };
}
