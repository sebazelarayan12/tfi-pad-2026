import {
  ApiClientProvider,
  createApiClient,
  type CuotaResponse,
  type PagoResponse,
} from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { DeudaVencidaWidget } from './DeudaVencidaWidget';
import { PagosWidget } from './PagosWidget';
import { PolizaRail } from './PolizaRail';

const ID = 'd1000000-0000-0000-0000-000000000001';

const cuota = (numero: number, estado: number, recargo = 0): CuotaResponse => ({
  id: `q${numero}`,
  numero,
  importe: 10500,
  recargo,
  fechaVencimiento: '2026-12-10',
  estado: estado as CuotaResponse['estado'],
  fechaPago: null,
});

const pago = (n: number, parcial: Partial<PagoResponse> = {}): PagoResponse => ({
  id: `pago-${n}`,
  clienteId: 'c1',
  numero: `PAG-00000${n}`,
  estado: 'APROBADO',
  medio: 'CAJA',
  importe: 10000 + n,
  fechaCreacion: `2026-11-0${n}T15:00:00Z`,
  fechaAcreditacion: null,
  factura: {
    id: `f${n}`,
    pagoId: `pago-${n}`,
    numero: `0001-0000000${n}`,
    tipo: 'B',
    importe: 10000 + n,
    estado: 'AUTORIZADA',
    cae: '74123456789012',
    vencimientoCae: '2026-11-18',
    fechaEmision: `2026-11-0${n}T15:00:00Z`,
  },
  ...parcial,
});

const servirPagos = (respuesta: PagoResponse[] | Response) =>
  servidorMock.use(
    http.get('*/api/polizas/:id/pagos', () =>
      respuesta instanceof Response ? respuesta.clone() : HttpResponse.json(respuesta),
    ),
  );

function renderizar(ui: ReactNode) {
  const cliente = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'token' });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </ApiClientProvider>,
  );
}

describe('DeudaVencidaWidget', () => {
  it('suma importe más recargo de las vencidas', () => {
    renderizar(<DeudaVencidaWidget polizaId={ID} cuotas={[cuota(6, 1, 525), cuota(7, 1, 525)]} />);
    expect(screen.getByText(/22\.050,00/)).toBeInTheDocument();
  });

  it('el detalle nombra las cuotas vencidas', () => {
    renderizar(<DeudaVencidaWidget polizaId={ID} cuotas={[cuota(6, 1, 525), cuota(7, 1, 525)]} />);
    expect(screen.getByText('Cuotas 6 y 7, con recargo del 5%')).toBeInTheDocument();
  });

  it('con una y con tres cuotas usa la forma singular y la lista', () => {
    const { unmount } = renderizar(
      <DeudaVencidaWidget polizaId={ID} cuotas={[cuota(6, 1, 525)]} />,
    );
    expect(screen.getByText('Cuota 6, con recargo del 5%')).toBeInTheDocument();
    unmount();
    renderizar(
      <DeudaVencidaWidget polizaId={ID} cuotas={[cuota(6, 1), cuota(7, 1), cuota(8, 1)]} />,
    );
    expect(screen.getByText('Cuotas 6, 7 y 8, con recargo del 5%')).toBeInTheDocument();
  });

  it('sin vencidas muestra el texto y el botón queda deshabilitado', () => {
    renderizar(<DeudaVencidaWidget polizaId={ID} cuotas={[cuota(1, 2), cuota(2, 0)]} />);
    expect(screen.getByText('Sin cuotas vencidas.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar pago en caja' })).toBeDisabled();
  });

  it('ignora pendientes, pagadas y anuladas', () => {
    renderizar(
      <DeudaVencidaWidget
        polizaId={ID}
        cuotas={[cuota(1, 0, 525), cuota(2, 2), cuota(3, 3), cuota(4, 1, 525)]}
      />,
    );
    expect(screen.getByText(/11\.025,00/)).toBeInTheDocument();
    expect(screen.getByText('Cuota 4, con recargo del 5%')).toBeInTheDocument();
  });
});

describe('PagosWidget', () => {
  it('muestra como máximo 5 pagos, del más reciente al más antiguo', async () => {
    servirPagos([1, 2, 3, 4, 5, 6, 7].map((n) => pago(n)));
    renderizar(<PagosWidget polizaId={ID} />);
    const filas = await screen.findAllByRole('listitem');
    expect(filas).toHaveLength(5);
    expect(filas[0]).toHaveTextContent('10.007,00');
    expect(filas[4]).toHaveTextContent('10.003,00');
  });

  it('el badge de factura sigue el estado y sin factura no hay badge', async () => {
    servirPagos([
      pago(3),
      pago(2, {
        factura: { ...pago(2).factura!, estado: 'PENDIENTE_CAE', cae: null, numero: '' },
      }),
      pago(1, { factura: null }),
    ]);
    renderizar(<PagosWidget polizaId={ID} />);
    const filas = await screen.findAllByRole('listitem');
    expect(within(filas[0]!).getByText('Facturada')).toBeInTheDocument();
    expect(within(filas[1]!).getByText('Pendiente CAE')).toBeInTheDocument();
    expect(within(filas[2]!).queryByText(/Facturada|Pendiente CAE/)).not.toBeInTheDocument();
  });

  it('muestra fecha, medio e importe formateados', async () => {
    servirPagos([pago(2, { medio: 'PAGO_FACIL' })]);
    renderizar(<PagosWidget polizaId={ID} />);
    const fila = await screen.findByRole('listitem');
    expect(fila).toHaveTextContent('02/11/2026');
    expect(fila).toHaveTextContent('Pago Fácil');
  });

  it('vacío muestra Sin pagos registrados.', async () => {
    servirPagos([]);
    renderizar(<PagosWidget polizaId={ID} />);
    expect(await screen.findByText('Sin pagos registrados.')).toBeInTheDocument();
  });

  it('error muestra el mensaje y el detail', async () => {
    servirPagos(
      HttpResponse.json(
        { status: 500, detail: 'Ocurrió un error inesperado.' },
        { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    );
    renderizar(<PagosWidget polizaId={ID} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar los pagos. Ocurrió un error inesperado.',
    );
  });
});

describe('PolizaRail', () => {
  it('Deuda vencida aparece antes que Pagos', async () => {
    servirPagos([pago(1)]);
    renderizar(<PolizaRail polizaId={ID} cuotas={[cuota(1, 1, 525)]} />);
    const titulos = screen.getAllByRole('heading').map((titulo) => titulo.textContent);
    expect(titulos).toEqual(['Deuda vencida', 'Pagos']);
    await screen.findByRole('listitem');
  });

  it('a11y: sin violaciones', async () => {
    servirPagos([pago(1)]);
    const { container } = renderizar(<PolizaRail polizaId={ID} cuotas={[cuota(1, 1, 525)]} />);
    await screen.findByRole('listitem');
    await expectSinViolacionesA11y(container);
  });
});
