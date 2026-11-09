import type { CuotaResponse, PagoListadoResponse, PolizaListItemResponse } from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { http, HttpResponse } from 'msw';

export const URL_PAGOS = '*/api/pagos';
export const URL_POLIZAS = '*/api/polizas';

export function pagoListado(
  indice: number,
  parcial: Partial<PagoListadoResponse> = {},
): PagoListadoResponse {
  return {
    id: `pago-${indice}`,
    numero: `PAG-${String(indice).padStart(6, '0')}`,
    fechaCreacion: '2026-10-27T21:05:00Z',
    clienteNombre: 'Lucía Benítez',
    numeroPoliza: 'POL-0000057',
    cuotas: [8],
    medio: 'CAJA',
    importe: 26250,
    estado: 'APROBADO',
    factura: { numero: 'A-0003-00000187', estado: 'AUTORIZADA' },
    ...parcial,
  };
}

export function pagina<T>(items: T[], numeroPagina: number, total: number) {
  return { items, pagina: numeroPagina, tamanoPagina: 10, total };
}

/** Registra los query strings de `GET /api/pagos` y responde con `responder`. */
export function servirPagos(responder: (params: URLSearchParams) => Response) {
  const recibidos: URLSearchParams[] = [];
  servidorMock.use(
    http.get(URL_PAGOS, ({ request }) => {
      const params = new URL(request.url).searchParams;
      recibidos.push(params);
      return responder(params);
    }),
  );
  return recibidos;
}

export function respuestaPagos(items: PagoListadoResponse[], numeroPagina: number, total: number) {
  return HttpResponse.json(pagina(items, numeroPagina, total));
}

export const POLIZA_ID = 'poliza-57';

export const POLIZA_57: PolizaListItemResponse = {
  id: POLIZA_ID,
  numero: 'POL-0000057',
  clienteId: 'cliente-1',
  patente: 'AB123CD',
  codigoPlan: 'TC',
  primaMensual: 25000,
  fechaInicio: '2026-03-01',
  fechaFin: '2027-03-01',
  estado: 1,
};

export function cuotaDePoliza(numero: number, estado: CuotaResponse['estado']): CuotaResponse {
  return {
    id: `cuota-${numero}`,
    numero,
    importe: 25000,
    recargo: 0,
    fechaVencimiento: '2026-10-10',
    estado,
    fechaPago: null,
  };
}
