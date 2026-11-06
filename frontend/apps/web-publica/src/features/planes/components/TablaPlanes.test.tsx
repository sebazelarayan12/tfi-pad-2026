import { ApiClientProvider, createApiClient, type PlanResponse } from '@nexa/api';
import { planesError500 } from '@nexa/api/mocks/handlers/planes';
import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { TablaPlanes } from './TablaPlanes';

const RUTA_PLANES = '*/api/planes';

beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
afterEach(() => servidorMock.resetHandlers());
afterAll(() => servidorMock.close());

function renderizar() {
  const queryClient = new QueryClient();
  const cliente = createApiClient({ baseUrl: 'http://localhost' });
  return render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={queryClient}>
        <TablaPlanes />
      </QueryClientProvider>
    </ApiClientProvider>,
  );
}

async function tablaConDatos() {
  renderizar();
  await screen.findByText('$ 12.000,00');
  return screen.getByRole('table', { name: 'Planes de cobertura de referencia' });
}

describe('TablaPlanes', () => {
  it('muestra una columna por plan en el orden de la respuesta', async () => {
    const tabla = await tablaConDatos();
    const encabezados = within(tabla).getAllByRole('columnheader');

    expect(encabezados.map((th) => th.textContent)).toEqual([
      'RCResponsabilidad Civil',
      'TCTerceros Completo',
      'TRTodo Riesgo',
    ]);
    for (const th of encabezados) expect(th).toHaveAttribute('scope', 'col');
  });

  it('formatea primaBase con el formateador de es-AR', async () => {
    await tablaConDatos();

    expect(screen.getByText('$ 12.000,00')).toBeInTheDocument();
    expect(screen.getByText('$ 18.000,00')).toBeInTheDocument();
    expect(screen.getByText('$ 30.000,00')).toBeInTheDocument();
  });

  it('muestra las etiquetas desde y por mes en cada plan', async () => {
    await tablaConDatos();

    expect(screen.getAllByText('desde')).toHaveLength(3);
    expect(screen.getAllByText('por mes')).toHaveLength(3);
  });

  it('destaca solo la columna TC', async () => {
    const tabla = await tablaConDatos();
    const destacadas = tabla.querySelectorAll('[data-destacado="true"]');

    // El encabezado y la celda de precio de TC; nada de RC ni TR.
    expect(destacadas).toHaveLength(2);
    expect(destacadas[0]).toBe(within(tabla).getByRole('columnheader', { name: /^TC/ }));
    expect(destacadas[1]).toBe(screen.getByText('$ 18.000,00').closest('td'));
  });

  it('no muestra filas de coberturas', async () => {
    const tabla = await tablaConDatos();

    expect(within(tabla).getAllByRole('row')).toHaveLength(2);
    expect(screen.queryByText('Robo e incendio total')).not.toBeInTheDocument();
    expect(screen.queryByText('Daños por choque al vehículo')).not.toBeInTheDocument();
  });

  it('estado de carga: aria-busy y skeleton', async () => {
    servidorMock.use(
      http.get(RUTA_PLANES, async () => {
        await delay('infinite');
        return HttpResponse.json([]);
      }),
    );
    renderizar();

    const tabla = screen.getByRole('table', { name: 'Planes de cobertura de referencia' });
    expect(tabla).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Cargando planes…')).toBeInTheDocument();
    expect(screen.queryByText('desde')).not.toBeInTheDocument();
  });

  it('estado de error: muestra AlertaError con reintento', async () => {
    servidorMock.use(planesError500);
    renderizar();

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los planes.');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('reintentar vuelve a pedir los planes solo por clic', async () => {
    servidorMock.use(planesError500);
    let pedidos = 0;
    const contar = () => {
      pedidos += 1;
    };
    servidorMock.events.on('request:start', contar);
    const usuario = userEvent.setup();
    renderizar();

    const reintentar = await screen.findByRole('button', { name: 'Reintentar' });
    expect(pedidos).toBe(1);

    servidorMock.resetHandlers();
    await usuario.click(reintentar);

    expect(await screen.findByText('$ 12.000,00')).toBeInTheDocument();
    expect(screen.getByRole('table')).not.toHaveAttribute('aria-busy');
    expect(pedidos).toBe(2);
    servidorMock.events.removeListener('request:start', contar);
  });

  it('estado vacío', async () => {
    servidorMock.use(http.get(RUTA_PLANES, () => HttpResponse.json<PlanResponse[]>([])));
    renderizar();

    expect(
      await screen.findByText('Por el momento no hay planes disponibles.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = renderizar();
    await screen.findByText('$ 12.000,00');

    await expectSinViolacionesA11y(container);
  });
});
