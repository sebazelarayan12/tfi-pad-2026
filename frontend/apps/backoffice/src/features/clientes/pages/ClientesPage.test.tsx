import { ApiClientProvider, createApiClient, type ClienteResumenResponse } from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { clientesFixture } from '@nexa/api/mocks/fixtures/clientes';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClientesPage } from './ClientesPage';
import { useBusquedaClientes } from '../hooks/useBusquedaClientes';

const juan = clientesFixture[0]!.cliente;
const filas: ClienteResumenResponse[] = Array.from({ length: 21 }, (_, i) => ({
  id: `c1000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
  dni: String(30123456 + i),
  nombre: juan.nombre,
  apellido: juan.apellido,
  email: juan.email,
  telefono: null,
  activo: true,
}));
function servir(responder?: (params: URLSearchParams) => Response | Promise<Response>) {
  const pedidos: URLSearchParams[] = [];
  servidorMock.use(
    http.get('*/api/clientes', ({ request }) => {
      const params = new URL(request.url).searchParams;
      pedidos.push(params);
      if (responder) return responder(params);
      const pagina = Number(params.get('pagina') ?? 1);
      return HttpResponse.json({
        items: filas.slice((pagina - 1) * 10, pagina * 10),
        pagina,
        tamanoPagina: 10,
        total: filas.length,
      });
    }),
  );
  return pedidos;
}
function montar(entrada = '/clientes', state?: unknown) {
  const cliente = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'mock' });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const router = createMemoryRouter(
    [
      { path: '/clientes', element: <ClientesPage /> },
      { path: '/clientes/:id', element: <h1>Ficha de cliente</h1> },
    ],
    {
      initialEntries: [
        {
          pathname: entrada.split('?')[0],
          search: entrada.includes('?') ? `?${entrada.split('?')[1]}` : '',
          state,
        },
      ],
    },
  );
  const vista = render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ApiClientProvider>,
  );
  return { ...vista, router, queryClient };
}
afterEach(() => vi.useRealTimers());

describe('ClientesPage', () => {
  it('pide pagina=1, tamanoPagina=10 y muestra siete encabezados en orden', async () => {
    const pedidos = servir();
    montar();
    await screen.findByText('21 clientes');
    expect(Object.fromEntries(pedidos[0]!)).toEqual({ pagina: '1', tamanoPagina: '10' });
    const tabla = screen.getByRole('table', { name: 'Clientes' });
    expect(
      within(tabla)
        .getAllByRole('columnheader')
        .map((n) => n.textContent),
    ).toEqual(['Nombre', 'DNI', 'Email', 'Teléfono', 'Vehículos', 'Renaper', 'Pólizas activas']);
    expect(
      within(tabla)
        .getAllByRole('columnheader')
        .every((n) => n.getAttribute('scope') === 'col'),
    ).toBe(true);
    expect(within(tabla).getAllByRole('row')).toHaveLength(11);
  });
  it('formatea DNI y muestra teléfono/Renaper/conteos como — sin consultar detalles', async () => {
    const pedidos = servir();
    montar();
    await screen.findByText('21 clientes');
    const fila = screen.getAllByRole('row')[1]!;
    const celdas = within(fila).getAllByRole('cell');
    expect(celdas[1]).toHaveTextContent('30.123.456');
    for (const i of [3, 4, 5, 6]) expect(celdas[i]).toHaveTextContent('—');
    expect(pedidos).toHaveLength(1);
    expect(screen.queryByText('Validado')).toBeNull();
    expect(screen.queryByLabelText('Estado Renaper')).toBeNull();
    expect(screen.queryByLabelText('Activo')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Acciones de la fila' })).toBeNull();
  });
  it.each([
    ['30.123.456', 'dni', '30123456'],
    [' pér ', 'apellido', 'pér'],
    ['3051', 'apellido', '3051'],
  ])('busca %s por %s', async (texto, clave, esperado) => {
    const pedidos = servir();
    montar();
    await screen.findByText('21 clientes');
    const campo = screen.getByRole('searchbox', { name: 'Buscar por DNI o apellido' });
    campo.focus();
    fireEvent.change(campo, { target: { value: texto } });
    await waitFor(() => expect(pedidos.at(-1)?.get(clave)).toBe(esperado));
    expect(pedidos.at(-1)?.has(clave === 'dni' ? 'apellido' : 'dni')).toBe(false);
    expect(campo).toHaveFocus();
    expect(campo).toHaveValue(texto);
  });
  it('anterior/siguiente respetan límites, rango y reinicio al buscar', async () => {
    const pedidos = servir();
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('1-10 de 21');
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByText('11-20 de 21');
    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByText('21-21 de 21');
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    await usuario.click(screen.getByRole('button', { name: 'Anterior' }));
    await screen.findByText('11-20 de 21');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Pérez' } });
    await waitFor(() => expect(pedidos.at(-1)?.get('apellido')).toBe('Pérez'));
    expect(pedidos.at(-1)?.get('pagina')).toBe('1');
  });
  it('Atrás restaura filtro, página y campo sin perder la coherencia de las requests', async () => {
    const pedidos = servir();
    const { router } = montar('/clientes?q=Pérez&pagina=2');
    await screen.findByText('11-20 de 21');
    await act(() => router.navigate('/clientes?q=30123456'));
    await waitFor(() => expect(pedidos.at(-1)?.get('dni')).toBe('30123456'));
    await act(() => router.navigate(-1));
    await screen.findByText('11-20 de 21');
    expect(screen.getByRole('searchbox')).toHaveValue('Pérez');
    expect(router.state.location.search).toContain('pagina=2');
  });
  it('sin resultados ofrece limpiar y sin clientes no ofrece limpiar', async () => {
    servir((params) =>
      HttpResponse.json({
        items: [],
        pagina: 1,
        tamanoPagina: 10,
        total: 0,
        filtro: params.get('apellido'),
      }),
    );
    const usuario = userEvent.setup();
    montar('/clientes?q=SinCoincidencia');
    await screen.findByText('No hay clientes que coincidan con la búsqueda.');
    expect(screen.getByText('0 clientes')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    await screen.findByText('Todavía no hay clientes cargados.');
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).toBeNull();
    expect(screen.getByText('0-0 de 0')).toBeInTheDocument();
  });
  it.each([400, 403, 500])(
    'error %s no muestra una tabla vacía ni reintenta automáticamente',
    async (status) => {
      let fallar = true;
      const pedidos = servir(() =>
        fallar
          ? HttpResponse.json(
              { status, detail: 'Error de prueba' },
              { status, headers: { 'Content-Type': 'application/problem+json' } },
            )
          : HttpResponse.json({ items: [filas[0]], pagina: 1, tamanoPagina: 10, total: 1 }),
      );
      const usuario = userEvent.setup();
      montar();
      expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los clientes.');
      expect(screen.queryByRole('table')).toBeNull();
      expect(pedidos).toHaveLength(1);
      fallar = false;
      await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));
      await screen.findByText('1 cliente');
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
      expect(pedidos).toHaveLength(2);
    },
  );
  it('durante carga hay diez filas de esqueleto y guiones, con input activo', async () => {
    servir(async () => {
      await delay(100);
      return HttpResponse.json({ items: [filas[0]], pagina: 1, tamanoPagina: 10, total: 1 });
    });
    montar();
    expect(screen.getByRole('table').parentElement).toHaveAttribute('aria-busy', 'true');
    expect(screen.getAllByRole('row')).toHaveLength(11);
    expect(screen.getByRole('status')).toHaveTextContent('—');
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toHaveTextContent('—');
    expect(screen.getByRole('searchbox')).toBeEnabled();
    await screen.findByText('1 cliente');
  });
  it.each(['exito', 'advertencia'])(
    'aviso %s aparece al entrar y no vuelve al paginar o navegar Atrás',
    async (tipo) => {
      servir();
      const { router } = montar('/clientes', { aviso: { tipo, texto: 'Cliente guardado.' } });
      expect(screen.getByRole('alert')).toHaveTextContent('Cliente guardado.');
      await screen.findByText('21 clientes');
      await act(() => router.navigate('/clientes?pagina=2'));
      await screen.findByText('11-20 de 21');
      expect(screen.queryByRole('alert')).toBeNull();
      await act(() => router.navigate(-1));
      expect(screen.queryByRole('alert')).toBeNull();
    },
  );
  it('ignora avisos malformados y no muestra datos fijos del Figma', async () => {
    servir();
    montar('/clientes', { aviso: { tipo: 'otro', texto: { dato: 'inválido' } } });
    await screen.findByText('21 clientes');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText(/Tomás|128 clientes/)).toBeNull();
    expect(screen.queryByText('30.512.468')).toBeNull();
  });
  it('consume el aviso del historial y no lo repite después de salir de la pantalla', async () => {
    servir();
    const { router } = montar('/clientes', {
      aviso: { tipo: 'exito', texto: 'Cliente guardado.' },
      conservar: true,
    });
    await screen.findByText('21 clientes');
    expect(router.state.location.state).toEqual({ conservar: true });
    expect(screen.getByRole('alert')).toHaveTextContent('Cliente guardado.');
    await act(() => router.navigate(`/clientes/${filas[0]!.id}`));
    await screen.findByRole('heading', { name: 'Ficha de cliente' });
    await act(() => router.navigate(-1));
    await screen.findByText('21 clientes');
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('nombre enlaza a la ficha y no hay errores de accesibilidad', async () => {
    servir(() => HttpResponse.json({ items: [filas[0]], pagina: 1, tamanoPagina: 10, total: 1 }));
    const usuario = userEvent.setup();
    const { container } = montar();
    await screen.findByText('1 cliente');
    const enlace = screen.getByRole('link', { name: 'Juan Carlos Pérez' });
    expect(enlace).toHaveAttribute('href', `/clientes/${filas[0]!.id}`);
    await expectSinViolacionesA11y(container);
    await usuario.click(enlace);
    expect(await screen.findByRole('heading', { name: 'Ficha de cliente' })).toBeInTheDocument();
  });
});

it('debounce espera 300 ms y cancela búsquedas intermedias al escribir o desmontar', () => {
  vi.useFakeTimers();
  const { result, rerender, unmount } = renderHook(({ texto }) => useBusquedaClientes(texto), {
    initialProps: { texto: '' },
  });
  rerender({ texto: 'Pé' });
  act(() => vi.advanceTimersByTime(299));
  expect(result.current.pendiente).toBe(true);
  expect(result.current.filtro).toEqual({});
  rerender({ texto: 'Pérez' });
  act(() => vi.advanceTimersByTime(299));
  expect(result.current.filtro).toEqual({});
  act(() => vi.advanceTimersByTime(1));
  expect(result.current.filtro).toEqual({ apellido: 'Pérez' });
  rerender({ texto: 'Otra búsqueda' });
  unmount();
  act(() => vi.runOnlyPendingTimers());
});
