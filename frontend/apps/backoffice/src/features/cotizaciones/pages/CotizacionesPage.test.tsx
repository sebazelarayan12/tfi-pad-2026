import {
  ApiClientProvider,
  createApiClient,
  TEXTO_SIN_DATO,
  type CotizacionListItemResponse,
} from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { CotizacionesPage } from './CotizacionesPage';

const URL_COTIZACIONES = '*/api/cotizaciones';

function cotizacion(
  indice: number,
  parcial: Partial<CotizacionListItemResponse> = {},
): CotizacionListItemResponse {
  return {
    id: `cotizacion-${indice}`,
    planId: 'plan-tc',
    codigoPlan: 'TC',
    nombrePlan: 'Terceros Completo',
    clienteId: 'cliente-1',
    clienteNombre: 'Juan Carlos Pérez',
    vehiculoId: 'vehiculo-1',
    patente: 'AB123CD',
    primaMensual: 18000,
    fechaCotizacion: '2026-11-08T15:00:00Z',
    fechaVencimiento: '2026-11-23T15:00:00Z',
    vigente: true,
    origen: 1,
    ...parcial,
  };
}

function diez(desde = 1) {
  return Array.from({ length: 10 }, (_, i) => cotizacion(desde + i));
}

const respuesta = (items: CotizacionListItemResponse[], pagina: number, total: number) =>
  HttpResponse.json({ items, pagina, tamanoPagina: 10, total });

/** Registra los query strings de `GET /api/cotizaciones` y responde con `responder`. */
function servir(responder: (params: URLSearchParams) => Response) {
  const recibidos: URLSearchParams[] = [];
  servidorMock.use(
    http.get(URL_COTIZACIONES, ({ request }) => {
      const params = new URL(request.url).searchParams;
      recibidos.push(params);
      return responder(params);
    }),
  );
  return recibidos;
}

function montar() {
  const api = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'mock' });
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ApiClientProvider client={api}>
      <QueryClientProvider client={cache}>
        <CotizacionesPage />
      </QueryClientProvider>
    </ApiClientProvider>,
  );
}

describe('CotizacionesPage: tabla', () => {
  it('muestra los encabezados en orden', async () => {
    servir(() => respuesta([cotizacion(1)], 1, 1));
    montar();

    const tabla = await screen.findByRole('table', { name: 'Cotizaciones' });
    const encabezados = within(tabla).getAllByRole('columnheader');
    expect(encabezados.map((th) => th.textContent)).toEqual([
      'Fecha',
      'Cliente',
      'Patente',
      'Plan',
      'Prima mensual',
      'Vence',
      'Estado',
      'Origen',
    ]);
    for (const th of encabezados) expect(th).toHaveAttribute('scope', 'col');
  });

  it('muestra los datos de la fila con los formatos del sistema', async () => {
    servir(() => respuesta([cotizacion(1)], 1, 1));
    montar();

    const fila = (await screen.findByText('Juan Carlos Pérez')).closest('tr')!;
    expect(fila).toHaveTextContent('08/11/2026');
    expect(fila).toHaveTextContent('AB123CD');
    expect(fila).toHaveTextContent('Terceros Completo');
    expect(fila).toHaveTextContent('$ 18.000,00');
    expect(fila).toHaveTextContent('23/11/2026');
    expect(within(fila).getByText('Vigente')).toBeInTheDocument();
    expect(fila).toHaveTextContent('Panel');
  });

  it('una cotización vencida muestra el estado Vencida', async () => {
    servir(() => respuesta([cotizacion(1, { vigente: false })], 1, 1));
    montar();

    const fila = (await screen.findByText('Juan Carlos Pérez')).closest('tr')!;
    expect(within(fila).getByText('Vencida')).toBeInTheDocument();
  });

  it('sin cliente ni vehículo registrados muestra el texto de sin dato', async () => {
    servir(() =>
      respuesta(
        [cotizacion(1, { clienteId: null, clienteNombre: null, vehiculoId: null, patente: null })],
        1,
        1,
      ),
    );
    montar();

    const fila = (await screen.findByText('Terceros Completo')).closest('tr')!;
    expect(within(fila).getAllByText(TEXTO_SIN_DATO)).toHaveLength(2);
  });

  it('muestra el esqueleto de 10 filas mientras carga', async () => {
    servir(() => respuesta(diez(), 1, 25));
    montar();

    expect(screen.getByTestId('esqueleto-cotizaciones').children).toHaveLength(10);
    await screen.findAllByText('Juan Carlos Pérez');
    expect(screen.queryByTestId('esqueleto-cotizaciones')).not.toBeInTheDocument();
  });

  it('una tabla vacía muestra el mensaje', async () => {
    servir(() => respuesta([], 1, 0));
    montar();

    expect(await screen.findByText('No hay cotizaciones para mostrar.')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 0 a 0 de 0 cotizaciones')).toBeInTheDocument();
  });

  it('un error muestra el detail del back', async () => {
    servir(() =>
      HttpResponse.json(
        { status: 500, detail: 'Falló el servidor.' },
        { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    );
    montar();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar las cotizaciones. Falló el servidor.',
    );
  });
});

describe('CotizacionesPage: filtro y paginación', () => {
  it('arranca en Todas y sin enviar el parámetro vigente', async () => {
    const recibidos = servir(() => respuesta(diez(), 1, 25));
    montar();
    await screen.findAllByText('Juan Carlos Pérez');

    expect(screen.getByLabelText('Estado')).toHaveValue('Todas');
    expect(recibidos[0]?.has('vigente')).toBe(false);
    expect(recibidos[0]?.get('pagina')).toBe('1');
    expect(recibidos[0]?.get('tamano')).toBe('10');
  });

  it('elegir Vigentes envía vigente=true y Vencidas vigente=false', async () => {
    const usuario = userEvent.setup();
    const recibidos = servir(() => respuesta(diez(), 1, 25));
    montar();
    await screen.findAllByText('Juan Carlos Pérez');

    await usuario.selectOptions(screen.getByLabelText('Estado'), 'Vigentes');
    await waitFor(() => expect(recibidos.at(-1)?.get('vigente')).toBe('true'));

    await usuario.selectOptions(screen.getByLabelText('Estado'), 'Vencidas');
    await waitFor(() => expect(recibidos.at(-1)?.get('vigente')).toBe('false'));

    await usuario.selectOptions(screen.getByLabelText('Estado'), 'Todas');
    await waitFor(() => expect(recibidos.at(-1)?.has('vigente')).toBe(false));
  });

  it('Siguiente avanza de página y cambiar el filtro vuelve a la página 1', async () => {
    const usuario = userEvent.setup();
    const recibidos = servir((params) =>
      respuesta(diez(), Number(params.get('pagina')), 25),
    );
    montar();
    await screen.findAllByText('Juan Carlos Pérez');

    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(() => expect(recibidos.at(-1)?.get('pagina')).toBe('2'));
    expect(await screen.findByText('Mostrando 11 a 20 de 25 cotizaciones')).toBeInTheDocument();

    await usuario.selectOptions(screen.getByLabelText('Estado'), 'Vigentes');
    await waitFor(() => {
      expect(recibidos.at(-1)?.get('pagina')).toBe('1');
      expect(recibidos.at(-1)?.get('vigente')).toBe('true');
    });
  });

  it('Anterior está deshabilitado en la primera página y Siguiente en la última', async () => {
    servir(() => respuesta(diez(), 1, 10));
    montar();
    await screen.findAllByText('Juan Carlos Pérez');

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  it('a11y: sin violaciones', async () => {
    servir(() => respuesta(diez(), 1, 25));
    const { container } = montar();
    await screen.findAllByText('Juan Carlos Pérez');

    await expectSinViolacionesA11y(container);
  });
});
