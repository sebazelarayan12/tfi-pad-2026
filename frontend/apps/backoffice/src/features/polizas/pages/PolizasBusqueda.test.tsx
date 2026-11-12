import { ApiClientProvider, createApiClient, type PolizaListItemResponse } from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PolizasListadoPage } from './PolizasListadoPage';

const flags = vi.hoisted(() => ({ disponible: false }));
vi.mock('../lib/busquedaDisponible', () => ({
  get BUSQUEDA_NUMERO_DNI_DISPONIBLE() {
    return flags.disponible;
  },
}));

const CLIENTE_ID = 'c1000000-0000-0000-0000-000000000001';

function poliza(indice: number): PolizaListItemResponse {
  return {
    id: `d1000000-0000-0000-0000-${String(indice).padStart(12, '0')}`,
    numero: `POL-${String(indice).padStart(7, '0')}`,
    clienteId: CLIENTE_ID,
    clienteNombre: 'Juan Carlos Pérez',
    patente: 'AB123CD',
    vehiculoMarca: 'Toyota',
    vehiculoModelo: 'Corolla XEi',
    vehiculoAnio: 2021,
    codigoPlan: 'RC',
    primaMensual: 12000,
    fechaInicio: '2026-11-01',
    fechaFin: '2027-05-01',
    estado: 1,
    proximoVencimiento: null,
  };
}

const pagina = (items: PolizaListItemResponse[]) => ({
  items,
  pagina: 1,
  tamanoPagina: 10,
  total: items.length,
});

function servir() {
  const polizas: URLSearchParams[] = [];
  const clientes: URLSearchParams[] = [];
  servidorMock.use(
    http.get('*/api/polizas', ({ request }) => {
      polizas.push(new URL(request.url).searchParams);
      return HttpResponse.json(pagina([poliza(1), poliza(2)]));
    }),
    http.get('*/api/clientes', ({ request }) => {
      const params = new URL(request.url).searchParams;
      clientes.push(params);
      const items =
        params.get('dni') === '30123456'
          ? [{ id: CLIENTE_ID, dni: '30123456', nombre: 'Juan', apellido: 'Pérez' }]
          : [];
      return HttpResponse.json({ items, pagina: 1, tamanoPagina: 1, total: items.length });
    }),
  );
  return { polizas, clientes };
}

function Ubicacion() {
  const { pathname, search } = useLocation();
  return <p data-testid="ubicacion">{pathname + search}</p>;
}

function renderizar(entrada = '/polizas') {
  const cliente = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'token' });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[entrada]}>
          <Routes>
            <Route path="/polizas" element={<PolizasListadoPage />} />
          </Routes>
          <Ubicacion />
        </MemoryRouter>
      </QueryClientProvider>
    </ApiClientProvider>,
  );
}

const campo = () => screen.getByRole('textbox', { name: 'Buscar por número, DNI o patente' });
const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

async function cargar() {
  const usuario = userEvent.setup();
  const llamadas = servir();
  const { container } = renderizar();
  await screen.findByText('POL-0000001');
  return { usuario, container, ...llamadas };
}

beforeEach(() => {
  flags.disponible = false;
});

describe('búsqueda de pólizas', () => {
  it('muestra la etiqueta, el placeholder y el helper vinculado al campo', async () => {
    await cargar();
    expect(campo()).toHaveAttribute('placeholder', 'Ej. POL-0000042');
    expect(campo()).toHaveAccessibleDescription('Número de póliza, DNI del titular o patente.');
    expect(screen.queryByRole('combobox', { name: /plan/i })).not.toBeInTheDocument();
  });

  it('patente: envía patente= en mayúsculas, sin numero ni dni, y no toca la URL', async () => {
    const { usuario, polizas } = await cargar();
    await usuario.type(campo(), '  ae789fg ');
    await waitFor(() => expect(polizas.at(-1)?.get('patente')).toBe('AE789FG'));
    const ultima = polizas.at(-1);
    expect(ultima?.has('numero')).toBe(false);
    expect(ultima?.has('dni')).toBe(false);
    expect(screen.getByTestId('ubicacion')).toHaveTextContent(/^\/polizas$/);
  });

  it('debounce: una sola request por búsqueda, no una por tecla', async () => {
    const { usuario, polizas } = await cargar();
    await usuario.type(campo(), 'AE789FG');
    await waitFor(() => expect(polizas.some((p) => p.has('patente'))).toBe(true));
    await esperar(450);
    expect(polizas.filter((p) => p.has('patente'))).toHaveLength(1);
  });

  it('Enter busca de inmediato y cancela el debounce', async () => {
    const { usuario, polizas } = await cargar();
    await usuario.type(campo(), 'AE789FG{Enter}');
    await waitFor(() => expect(polizas.at(-1)?.get('patente')).toBe('AE789FG'));
    await esperar(450);
    expect(polizas.filter((p) => p.has('patente'))).toHaveLength(1);
  });

  it('combina con el estado y reinicia la página', async () => {
    const usuario = userEvent.setup();
    const { polizas } = servir();
    renderizar('/polizas?estado=Vigente&pagina=3');
    await screen.findByText('POL-0000001');
    await usuario.type(campo(), 'AE789FG{Enter}');
    await waitFor(() => expect(polizas.at(-1)?.get('patente')).toBe('AE789FG'));
    expect(polizas.at(-1)?.get('estado')).toBe('Vigente');
    expect(polizas.at(-1)?.get('pagina')).toBe('1');
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/polizas?estado=Vigente');
  });

  it('texto inválido: error de campo, aria-invalid y sin request', async () => {
    const { usuario, polizas, clientes, container } = await cargar();
    const antes = polizas.length;
    await usuario.type(campo(), 'hola 123{Enter}');
    expect(
      await screen.findByText('Ingresá un número de póliza, un DNI o una patente válida.'),
    ).toBeInTheDocument();
    expect(campo()).toHaveAttribute('aria-invalid', 'true');
    await esperar(450);
    expect(polizas).toHaveLength(antes);
    expect(clientes).toHaveLength(0);
    await expectSinViolacionesA11y(container);
  });

  it.each(['POL-0000042', '30123456'])(
    'constante en false: %s no hace request y avisa que no está disponible',
    async (texto) => {
      const { usuario, polizas, clientes } = await cargar();
      const antes = polizas.length;
      await usuario.type(campo(), texto + '{Enter}');
      expect(
        await screen.findByText('Todavía no se puede buscar por número ni DNI.'),
      ).toBeInTheDocument();
      await esperar(450);
      expect(polizas).toHaveLength(antes);
      expect(clientes).toHaveLength(0);
    },
  );

  it('constante en true: el número envía numero=', async () => {
    flags.disponible = true;
    const { usuario, polizas } = await cargar();
    await usuario.type(campo(), 'pol-0000042{Enter}');
    await waitFor(() => expect(polizas.at(-1)?.get('numero')).toBe('POL-0000042'));
  });

  it('constante en true: el DNI consulta clientes y después pólizas con clienteId', async () => {
    flags.disponible = true;
    const { usuario, polizas, clientes } = await cargar();
    await usuario.type(campo(), '30123456{Enter}');
    await waitFor(() => expect(polizas.at(-1)?.get('clienteId')).toBe(CLIENTE_ID));
    expect(clientes.at(-1)?.get('dni')).toBe('30123456');
    expect(polizas.at(-1)?.has('dni')).toBe(false);
  });

  it('constante en true: un DNI sin cliente deja la tabla vacía sin pedir pólizas', async () => {
    flags.disponible = true;
    const { usuario, polizas, clientes } = await cargar();
    const antes = polizas.length;
    await usuario.type(campo(), '11222333{Enter}');
    expect(await screen.findByText('No hay pólizas que coincidan con los filtros.')).toBeVisible();
    expect(clientes).toHaveLength(1);
    expect(polizas).toHaveLength(antes);
  });

  it('error al buscar el cliente: alerta con el detalle y conserva la tabla', async () => {
    flags.disponible = true;
    const { usuario } = await cargar();
    servidorMock.use(
      http.get('*/api/clientes', () =>
        HttpResponse.json(
          { status: 500, detail: 'Falló la búsqueda del cliente.' },
          { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );
    await usuario.type(campo(), '30123456{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Falló la búsqueda del cliente.');
    expect(screen.getByText('POL-0000001')).toBeInTheDocument();
  });
});
