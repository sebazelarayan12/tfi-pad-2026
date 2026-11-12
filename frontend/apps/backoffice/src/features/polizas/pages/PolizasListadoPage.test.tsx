import { ApiClientProvider, createApiClient, type PolizaListItemResponse } from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { PolizasListadoPage } from './PolizasListadoPage';

const URL_POLIZAS = '*/api/polizas';

function poliza(
  indice: number,
  parcial: Partial<PolizaListItemResponse> = {},
): PolizaListItemResponse {
  const numero = String(indice).padStart(7, '0');
  return {
    id: `d1000000-0000-0000-0000-${String(indice).padStart(12, '0')}`,
    numero: `POL-${numero}`,
    clienteId: 'c1000000-0000-0000-0000-000000000001',
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
    ...parcial,
  };
}

function pagina(items: PolizaListItemResponse[], numeroPagina: number, total: number) {
  return { items, pagina: numeroPagina, tamanoPagina: 10, total };
}

function diezPolizas(desde = 1) {
  return Array.from({ length: 10 }, (_, i) => poliza(desde + i));
}

/** Registra los query strings recibidos y responde con `responder`. */
function servirPolizas(responder: (params: URLSearchParams) => Response | Promise<Response>) {
  const recibidos: URLSearchParams[] = [];
  servidorMock.use(
    http.get(URL_POLIZAS, ({ request }) => {
      const params = new URL(request.url).searchParams;
      recibidos.push(params);
      return responder(params);
    }),
  );
  return recibidos;
}

function UbicacionActual() {
  const ubicacion = useLocation();
  return <p data-testid="ubicacion">{`${ubicacion.pathname}${ubicacion.search}`}</p>;
}

function renderizar(entrada = '/polizas') {
  const cliente = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'token' });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[entrada]}>
          <Routes>
            <Route path="/polizas" element={<PolizasListadoPage />} />
            <Route path="/clientes" element={<p>Pantalla de clientes</p>} />
          </Routes>
          <UbicacionActual />
        </MemoryRouter>
      </QueryClientProvider>
    </ApiClientProvider>,
  );
}

const problema = (status: number, cuerpo: object) =>
  HttpResponse.json(cuerpo, { status, headers: { 'Content-Type': 'application/problem+json' } });

describe('PolizasListadoPage', () => {
  it('request: primera carga envía pagina=1 y tamano=10 sin estado', async () => {
    const recibidos = servirPolizas(() => HttpResponse.json(pagina(diezPolizas(), 1, 390)));
    renderizar();

    await screen.findByText('POL-0000001');
    expect(recibidos).toHaveLength(1);
    expect(recibidos[0]?.get('pagina')).toBe('1');
    expect(recibidos[0]?.get('tamano')).toBe('10');
    expect(recibidos[0]?.has('estado')).toBe(false);
  });

  it('request: elegir Vigente envía estado=Vigente y no el número', async () => {
    const usuario = userEvent.setup();
    const recibidos = servirPolizas(() => HttpResponse.json(pagina(diezPolizas(), 1, 390)));
    renderizar();
    await screen.findByText('POL-0000001');

    await usuario.click(screen.getByRole('radio', { name: 'Vigente' }));

    await waitFor(() => expect(recibidos.at(-1)?.get('estado')).toBe('Vigente'));
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/polizas?estado=Vigente');
  });

  it('request: nunca envía numero, dni ni planCodigo', async () => {
    const recibidos = servirPolizas(() => HttpResponse.json(pagina(diezPolizas(), 1, 390)));
    renderizar('/polizas?estado=Vigente&pagina=2&numero=POL-1&dni=30123456&planCodigo=RC');

    await screen.findByText('POL-0000001');
    for (const params of recibidos) {
      expect(params.has('numero')).toBe(false);
      expect(params.has('dni')).toBe(false);
      expect(params.has('planCodigo')).toBe(false);
    }
  });

  it('chips: solo uno seleccionado a la vez y sin conteos', async () => {
    const usuario = userEvent.setup();
    servirPolizas(() => HttpResponse.json(pagina(diezPolizas(), 1, 390)));
    renderizar();
    await screen.findByText('POL-0000001');

    const grupo = screen.getByRole('radiogroup', { name: 'Estado de la póliza' });
    const radios = within(grupo).getAllByRole('radio');
    expect(radios.map((radio) => radio.textContent)).toEqual([
      'Todas',
      'Pendiente',
      'Vigente',
      'Suspendida',
      'Cancelada',
      'Vencida',
    ]);
    expect(radios.filter((radio) => radio.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    expect(screen.getByRole('radio', { name: 'Todas' })).toBeChecked();

    await usuario.click(screen.getByRole('radio', { name: 'Cancelada' }));
    expect(radios.filter((radio) => radio.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    expect(screen.getByRole('radio', { name: 'Cancelada' })).toBeChecked();
  });

  it('chips: las flechas mueven la selección', async () => {
    const usuario = userEvent.setup();
    servirPolizas(() => HttpResponse.json(pagina(diezPolizas(), 1, 390)));
    renderizar();
    await screen.findByText('POL-0000001');

    screen.getByRole('radio', { name: 'Todas' }).focus();
    await usuario.keyboard('{ArrowRight}');

    expect(screen.getByRole('radio', { name: 'Pendiente' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Pendiente' })).toHaveFocus();
  });

  it('chips: cambiar estado vuelve a pagina=1', async () => {
    const usuario = userEvent.setup();
    const recibidos = servirPolizas(() => HttpResponse.json(pagina(diezPolizas(), 3, 390)));
    renderizar('/polizas?pagina=3');
    await screen.findByText('POL-0000001');

    await usuario.click(screen.getByRole('radio', { name: 'Vencida' }));

    await waitFor(() => expect(recibidos.at(-1)?.get('estado')).toBe('Vencida'));
    expect(recibidos.at(-1)?.get('pagina')).toBe('1');
  });

  it('chips: Todas quita el parámetro estado', async () => {
    const usuario = userEvent.setup();
    const recibidos = servirPolizas(() => HttpResponse.json(pagina(diezPolizas(), 1, 390)));
    renderizar('/polizas?estado=Vigente');
    await screen.findByText('POL-0000001');

    await usuario.click(screen.getByRole('radio', { name: 'Todas' }));

    await waitFor(() => expect(recibidos.at(-1)?.has('estado')).toBe(false));
    expect(screen.getByTestId('ubicacion')).toHaveTextContent(/^\/polizas$/);
  });

  it('paginación: rango 1-10 de 390 en la primera página', async () => {
    servirPolizas(() => HttpResponse.json(pagina(diezPolizas(), 1, 390)));
    renderizar();

    expect(await screen.findByText('1-10 de 390')).toBeInTheDocument();
  });

  it('paginación: Siguiente avanza la página y Anterior queda habilitado', async () => {
    const usuario = userEvent.setup();
    const recibidos = servirPolizas((params) => {
      const numero = Number(params.get('pagina'));
      return HttpResponse.json(pagina(diezPolizas((numero - 1) * 10 + 1), numero, 390));
    });
    renderizar();
    await screen.findByText('1-10 de 390');

    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('11-20 de 390')).toBeInTheDocument();
    expect(recibidos.at(-1)?.get('pagina')).toBe('2');
    expect(screen.getByRole('button', { name: 'Anterior' })).toHaveAttribute(
      'aria-disabled',
      'false',
    );
  });

  it('paginación: Anterior deshabilitado en la página 1', async () => {
    const usuario = userEvent.setup();
    const recibidos = servirPolizas(() => HttpResponse.json(pagina(diezPolizas(), 1, 390)));
    renderizar();
    await screen.findByText('1-10 de 390');

    const anterior = screen.getByRole('button', { name: 'Anterior' });
    expect(anterior).toHaveAttribute('aria-disabled', 'true');
    await usuario.click(anterior);
    expect(recibidos).toHaveLength(1);
  });

  it('paginación: Siguiente deshabilitado en la última', async () => {
    servirPolizas(() => HttpResponse.json(pagina(diezPolizas(381), 39, 390)));
    renderizar('/polizas?pagina=39');

    await screen.findByText('381-390 de 390');
    expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('paginación: página fuera de rango muestra 0-0 y el estado vacío', async () => {
    servirPolizas(() => HttpResponse.json(pagina([], 99, 390)));
    renderizar('/polizas?pagina=99');

    expect(await screen.findByText('0-0 de 390')).toBeInTheDocument();
    expect(screen.getByText('No hay pólizas que coincidan con los filtros.')).toBeInTheDocument();
  });

  it('tabla: el número es un enlace a /polizas/:id', async () => {
    servirPolizas(() => HttpResponse.json(pagina([poliza(7)], 1, 1)));
    renderizar();

    const enlace = await screen.findByRole('link', { name: 'POL-0000007' });
    expect(enlace).toHaveAttribute('href', '/polizas/d1000000-0000-0000-0000-000000000007');
  });

  it('tabla: vigencia con formato dd/MM/yyyy a dd/MM/yyyy', async () => {
    servirPolizas(() => HttpResponse.json(pagina([poliza(1)], 1, 1)));
    renderizar();

    expect(await screen.findByText('01/11/2026 a 01/05/2027')).toBeInTheDocument();
  });

  it('tabla: estado muestra la etiqueta de T-10 como texto', async () => {
    servirPolizas(() =>
      HttpResponse.json(
        pagina(
          [poliza(1, { estado: 0 }), poliza(2, { estado: 3 }), poliza(3, { estado: 4 })],
          1,
          3,
        ),
      ),
    );
    renderizar();

    const tabla = await screen.findByRole('table', { name: 'Pólizas' });
    expect(within(tabla).getByText('Pendiente')).toBeInTheDocument();
    expect(within(tabla).getByText('Cancelada')).toBeInTheDocument();
    expect(within(tabla).getByText('Vencida')).toBeInTheDocument();
  });

  it('tabla: muestra el cliente, el vehículo y el próximo vencimiento', async () => {
    servirPolizas(() =>
      HttpResponse.json(pagina([poliza(1, { proximoVencimiento: '2027-01-10' })], 1, 1)),
    );
    renderizar();

    const tabla = await screen.findByRole('table', { name: 'Pólizas' });
    expect(within(tabla).getByText('Juan Carlos Pérez')).toBeInTheDocument();
    expect(within(tabla).getByText('Toyota Corolla XEi 2021')).toBeInTheDocument();
    expect(within(tabla).getByText('10/01/2027')).toBeInTheDocument();
    expect(within(tabla).queryByText('No disponible')).not.toBeInTheDocument();
  });

  it('tabla: sin cuotas pendientes el próximo vencimiento es un guion', async () => {
    servirPolizas(() =>
      HttpResponse.json(pagina([poliza(1, { estado: 3, proximoVencimiento: null })], 1, 1)),
    );
    renderizar();

    const tabla = await screen.findByRole('table', { name: 'Pólizas' });
    const fila = within(tabla).getByText('POL-0000001').closest('tr')!;
    expect(within(fila).getByText('-')).toBeInTheDocument();
  });

  it('tabla: vehículo muestra la patente en mono', async () => {
    servirPolizas(() => HttpResponse.json(pagina([poliza(1, { patente: 'AC456DE' })], 1, 1)));
    renderizar();

    expect(await screen.findByText('AC456DE')).toHaveClass('font-mono');
  });

  it('a11y: caption oculto y th scope=col', async () => {
    servirPolizas(() => HttpResponse.json(pagina([poliza(1)], 1, 1)));
    renderizar();

    const tabla = await screen.findByRole('table', { name: 'Pólizas' });
    expect(tabla.querySelector('caption')).toHaveClass('sr-only');
    const encabezados = within(tabla).getAllByRole('columnheader');
    expect(encabezados.map((th) => th.textContent)).toEqual([
      'Número',
      'Cliente',
      'Vehículo',
      'Plan',
      'Vigencia',
      'Estado',
      'Próx. vencimiento',
    ]);
    for (const th of encabezados) expect(th).toHaveAttribute('scope', 'col');
  });

  it('vacío: muestra el texto DP-B13-04', async () => {
    servirPolizas(() => HttpResponse.json(pagina([], 1, 0)));
    renderizar();

    expect(
      await screen.findByText('No hay pólizas que coincidan con los filtros.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('carga: muestra el esqueleto y la paginación deshabilitada', async () => {
    servirPolizas(async () => {
      await new Promise((resolver) => setTimeout(resolver, 50));
      return HttpResponse.json(pagina(diezPolizas(), 1, 390));
    });
    renderizar();

    expect(screen.getByTestId('esqueleto-polizas').children).toHaveLength(10);
    expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await screen.findByText('POL-0000001');
    expect(screen.queryByTestId('esqueleto-polizas')).not.toBeInTheDocument();
  });

  it('error 5xx: muestra AlertaError y Reintentar, y reintenta', async () => {
    const usuario = userEvent.setup();
    let intentos = 0;
    servirPolizas(() => {
      intentos += 1;
      return intentos === 1
        ? problema(500, { status: 500, detail: 'Falló el servidor.' })
        : HttpResponse.json(pagina([poliza(1)], 1, 1));
    });
    renderizar();

    expect(await screen.findByRole('alert')).toHaveTextContent('Falló el servidor.');
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('POL-0000001')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('error 5xx sin detail: usa el texto DP-B13-05', async () => {
    servirPolizas(() => problema(500, { status: 500 }));
    renderizar();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar las pólizas. Intentá de nuevo.',
    );
  });

  it('error 400: conserva la tabla anterior y muestra detail', async () => {
    const usuario = userEvent.setup();
    servirPolizas((params) =>
      params.get('estado') === 'Vigente'
        ? problema(400, { status: 400, detail: 'El estado no es válido.' })
        : HttpResponse.json(pagina([poliza(1)], 1, 1)),
    );
    renderizar();
    await screen.findByText('POL-0000001');

    await usuario.click(screen.getByRole('radio', { name: 'Vigente' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El estado no es válido.');
    expect(screen.getByRole('table', { name: 'Pólizas' })).toBeInTheDocument();
    expect(screen.getByText('POL-0000001')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });

  it('cabecera: Emitir póliza navega a /clientes', async () => {
    const usuario = userEvent.setup();
    servirPolizas(() => HttpResponse.json(pagina([poliza(1)], 1, 1)));
    renderizar();
    expect(screen.getByRole('heading', { level: 1, name: 'Pólizas' })).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Emitir póliza' }));

    expect(await screen.findByText('Pantalla de clientes')).toBeInTheDocument();
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/clientes');
  });

  it('no aparecen el buscador ni el select de plan', async () => {
    servirPolizas(() => HttpResponse.json(pagina([poliza(1)], 1, 1)));
    renderizar();
    await screen.findByText('POL-0000001');

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('a11y: sin violaciones con datos', async () => {
    servirPolizas(() => HttpResponse.json(pagina(diezPolizas(), 1, 390)));
    const { container } = renderizar();
    await screen.findByText('POL-0000001');

    await expectSinViolacionesA11y(container);
  });
});
