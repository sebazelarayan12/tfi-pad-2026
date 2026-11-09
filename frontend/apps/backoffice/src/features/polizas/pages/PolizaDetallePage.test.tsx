import {
  ApiClientProvider,
  createApiClient,
  type CuotaResponse,
  type PolizaDetalleResponse,
} from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { PolizaDetallePage } from './PolizaDetallePage';

const ID = 'd1000000-0000-0000-0000-000000000001';
const CLIENTE_ID = 'c1000000-0000-0000-0000-000000000001';
const VEHICULO_ID = 'b1000000-0000-0000-0000-000000000001';

const cuota = (numero: number, parcial: Partial<CuotaResponse> = {}): CuotaResponse => ({
  id: `q${numero}`,
  numero,
  importe: 10500,
  recargo: 0,
  fechaVencimiento: `2026-1${numero}-10`,
  estado: 0,
  fechaPago: null,
  ...parcial,
});

function poliza(parcial: Partial<PolizaDetalleResponse> = {}): PolizaDetalleResponse {
  return {
    id: ID,
    numero: 'POL-0000057',
    clienteId: CLIENTE_ID,
    vehiculoId: VEHICULO_ID,
    patente: 'AB123CD',
    marca: 'Toyota',
    modelo: 'Corolla XEi',
    planId: 'a1000000-0000-0000-0000-000000000001',
    codigoPlan: 'TC',
    nombrePlan: 'Terceros Completo',
    cotizacionId: null,
    primaMensual: 19800,
    vigenciaMeses: 12,
    fechaEmision: '2026-11-01T14:03:00',
    fechaInicio: '2026-11-01',
    fechaFin: '2027-11-01',
    estado: 1,
    cuotas: [
      cuota(1, { estado: 2, fechaPago: '2026-11-02T15:30:00' }),
      cuota(2, { estado: 1, recargo: 525 }),
      cuota(3, { estado: 3 }),
    ],
    ...parcial,
  };
}

const problema = (status: number, cuerpo: object) =>
  HttpResponse.json(cuerpo, { status, headers: { 'Content-Type': 'application/problem+json' } });

function servir(detalle: PolizaDetalleResponse | Response = poliza()) {
  const recibidos: string[] = [];
  servidorMock.use(
    http.get('*/api/polizas/:id', ({ params }) => {
      recibidos.push(String(params.id));
      return detalle instanceof Response ? detalle.clone() : HttpResponse.json(detalle);
    }),
    http.get('*/api/clientes/:id', () =>
      HttpResponse.json({
        id: CLIENTE_ID,
        nombre: 'Juan Carlos',
        apellido: 'Pérez',
        dni: '30123456',
        activo: true,
      }),
    ),
    http.get('*/api/vehiculos/:id', () =>
      HttpResponse.json({ id: VEHICULO_ID, anio: 2021, marca: 'Toyota', modelo: 'Corolla XEi' }),
    ),
  );
  return recibidos;
}

function renderizar(id = ID) {
  const cliente = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'token' });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/polizas/' + id]}>
          <Routes>
            <Route path="/polizas/:id" element={<PolizaDetallePage />} />
            <Route path="/polizas" element={<p>Listado</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ApiClientProvider>,
  );
}

describe('PolizaDetallePage', () => {
  it('encabezado: h1 con el número en mono y badge con la etiqueta del estado', async () => {
    servir();
    renderizar();
    const titulo = await screen.findByRole('heading', { level: 1, name: 'POL-0000057' });
    expect(titulo).toHaveClass('font-mono');
    expect(titulo.parentElement).toHaveTextContent('Vigente');
  });

  it('datos: muestra cliente, DNI, vehículo con año, plan, prima y vigencia', async () => {
    servir();
    renderizar();
    await screen.findByText('Juan Carlos Pérez');
    expect(screen.getByText('30.123.456')).toHaveClass('font-mono');
    expect(screen.getByText('Toyota Corolla XEi 2021')).toBeInTheDocument();
    expect(screen.getByText('AB123CD')).toHaveClass('font-mono');
    expect(screen.getByText('Terceros Completo (TC)')).toBeInTheDocument();
    expect(screen.getByText(/19\.800,00/)).toBeInTheDocument();
    expect(screen.getByText('12 meses, 01/11/2026 a 01/11/2027')).toBeInTheDocument();
  });

  it('datos: Emitida por dice No disponible', async () => {
    servir();
    renderizar();
    await screen.findByText('Juan Carlos Pérez');
    const fila = screen.getByText('Emitida por').parentElement;
    expect(fila).toHaveTextContent('No disponible');
  });

  it('datos: Cliente y DNI dicen No disponible si el cliente falla', async () => {
    servir();
    servidorMock.use(
      http.get('*/api/clientes/:id', () => problema(500, { status: 500, title: 'Error' })),
    );
    renderizar();
    await screen.findByRole('heading', { level: 1, name: 'POL-0000057' });
    expect(screen.getByText('Cliente').parentElement).toHaveTextContent('No disponible');
    expect(screen.getByText('DNI').parentElement).toHaveTextContent('No disponible');
  });

  it('datos: el vehículo se muestra sin año si el vehículo falla', async () => {
    servir();
    servidorMock.use(
      http.get('*/api/vehiculos/:id', () => problema(500, { status: 500, title: 'Error' })),
    );
    renderizar();
    expect(await screen.findByText('Toyota Corolla XEi')).toBeInTheDocument();
  });

  it('cuotas: muestra "n de total", vencimiento, importe con recargo y la etiqueta del estado', async () => {
    servir();
    renderizar();
    const tabla = await screen.findByRole('table', { name: 'Cuotas de la póliza' });
    const filas = within(tabla).getAllByRole('row');
    expect(within(filas[1]!).getByText('1 de 12')).toBeInTheDocument();
    expect(within(filas[1]!).getByText('Pagada')).toBeInTheDocument();
    expect(within(filas[2]!).getByText('2 de 12')).toBeInTheDocument();
    expect(within(filas[2]!).getByText('10/12/2026')).toBeInTheDocument();
    expect(within(filas[2]!).getByText(/11\.025,00/)).toBeInTheDocument();
    expect(within(filas[2]!).getByText('Vencida')).toBeInTheDocument();
    expect(within(filas[3]!).getByText('Anulada')).toBeInTheDocument();
    expect(
      screen.getByText('Vencen el día 10 de cada mes. Recargo del 5% al vencer.'),
    ).toBeInTheDocument();
  });

  it('cuotas: sin cuotas muestra el texto vacío', async () => {
    servir(poliza({ cuotas: [] }));
    renderizar();
    expect(await screen.findByText('No hay cuotas para esta póliza.')).toBeInTheDocument();
  });

  it('aviso: solo visible con la póliza Suspendida', async () => {
    servir(poliza({ estado: 2 }));
    const { unmount } = renderizar();
    expect(
      await screen.findByText(
        'Se suspendió por 2 cuotas vencidas impagas. Vuelve a Vigente al pagarlas.',
      ),
    ).toBeInTheDocument();
    unmount();
    servir(poliza({ estado: 1 }));
    renderizar();
    await screen.findByRole('heading', { level: 1, name: 'POL-0000057' });
    expect(screen.queryByText(/Se suspendió/)).not.toBeInTheDocument();
  });

  it('ciclo: la lista tiene 5 pasos y solo el actual lleva aria-current="step"', async () => {
    servir(poliza({ estado: 2 }));
    renderizar();
    const lista = await screen.findByRole('list');
    const pasos = within(lista).getAllByRole('listitem');
    expect(pasos).toHaveLength(5);
    expect(pasos.filter((paso) => paso.getAttribute('aria-current') === 'step')).toEqual([
      pasos[2],
    ]);
  });

  it('ciclo: una póliza Cancelada no tiene paso actual', async () => {
    servir(poliza({ estado: 3 }));
    renderizar();
    const lista = await screen.findByRole('list');
    expect(lista.querySelector('[aria-current]')).toBeNull();
  });

  it('acciones: la barra tiene los tres botones y la columna derecha trae el rail (B-18)', async () => {
    servir();
    renderizar();
    await screen.findByRole('heading', { level: 1, name: 'POL-0000057' });
    const grupo = screen.getByRole('group', { name: 'Acciones de la póliza' });
    expect(
      within(grupo)
        .getAllByRole('button')
        .map((boton) => boton.textContent),
    ).toEqual(['Registrar pago en caja', 'Cupón Pago Fácil', 'Cancelar póliza']);
    const rail = screen.getByRole('complementary', { name: 'Resumen de la póliza' });
    expect(within(rail).getByRole('heading', { name: 'Deuda vencida' })).toBeInTheDocument();
    expect(within(rail).getByRole('heading', { name: 'Pagos' })).toBeInTheDocument();
  });

  it('cancelar: al confirmar recarga el detalle y queda Cancelada con las cuotas Anuladas', async () => {
    const usuario = userEvent.setup();
    let cancelada = false;
    servir();
    servidorMock.use(
      http.get('*/api/polizas/:id', () =>
        HttpResponse.json(
          cancelada
            ? poliza({
                estado: 3,
                cuotas: [cuota(1, { estado: 2 }), cuota(2, { estado: 3 }), cuota(3, { estado: 3 })],
              })
            : poliza(),
        ),
      ),
      http.post('*/api/polizas/:id/cancelar', () => {
        cancelada = true;
        return HttpResponse.json(poliza({ estado: 3 }));
      }),
    );
    renderizar();
    await usuario.click(await screen.findByRole('button', { name: 'Cancelar póliza' }));
    await usuario.type(screen.getByLabelText('Motivo de cancelación'), 'Motivo');
    await usuario.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));
    const titulo = await screen.findByRole('heading', { level: 1, name: 'POL-0000057' });
    await waitFor(() => expect(titulo.parentElement).toHaveTextContent('Cancelada'));
    expect(screen.getAllByText('Anulada')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Cancelar póliza' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
  it('404: muestra el detail del back y un enlace a Pólizas', async () => {
    servir(problema(404, { status: 404, detail: `La póliza ${ID} no existe.` }));
    renderizar();
    expect(await screen.findByText(`La póliza ${ID} no existe.`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pólizas' })).toHaveAttribute('href', '/polizas');
  });

  it('un id que no es UUID no hace request y dice que no existe', async () => {
    const recibidos = servir();
    renderizar('abc');
    expect(await screen.findByText('La póliza abc no existe.')).toBeInTheDocument();
    expect(recibidos).toHaveLength(0);
  });

  it('403: muestra el acceso denegado', async () => {
    servir(problema(403, { status: 403, title: 'Forbidden' }));
    renderizar();
    expect(await screen.findByText('No tenés permiso para ver esta póliza.')).toBeInTheDocument();
  });

  it('500: muestra la alerta y Reintentar vuelve a pedir la póliza', async () => {
    const usuario = userEvent.setup();
    const recibidos = servir(problema(500, { status: 500, title: 'Error' }));
    renderizar();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cargar la póliza. Intentá de nuevo.',
    );
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByRole('alert');
    expect(recibidos.length).toBeGreaterThanOrEqual(2);
  });

  it('a11y: tabla con caption y encabezados de columna, sin violaciones', async () => {
    servir();
    const { container } = renderizar();
    const tabla = await screen.findByRole('table', { name: 'Cuotas de la póliza' });
    expect(within(tabla).getAllByRole('columnheader')).toHaveLength(4);
    await screen.findByText('Juan Carlos Pérez');
    await expectSinViolacionesA11y(container);
  });
});
