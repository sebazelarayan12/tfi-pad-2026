import {
  ApiClientProvider,
  createApiClient,
  ESTADO_POLIZA_NUMERO,
  type PolizaListItemResponse,
} from '@nexa/api';
import {
  CLIENTE_INACTIVO_ID,
  CLIENTE_JUAN_ID,
  clientesFixture,
} from '@nexa/api/mocks/fixtures/clientes';
import { VEHICULO_ID } from '@nexa/api/mocks/fixtures/vehiculos';
import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { FichaClientePage, type FichaClientePageProps } from './FichaClientePage';

const juan = clientesFixture[0]!.cliente;

const POLIZA: PolizaListItemResponse = {
  id: 'd1000000-0000-0000-0000-000000000001',
  numero: 'POL-0000001',
  clienteId: CLIENTE_JUAN_ID,
  patente: 'AB123CD',
  codigoPlan: 'RC',
  primaMensual: 12000,
  fechaInicio: '2026-11-01',
  fechaFin: '2027-05-01',
  estado: ESTADO_POLIZA_NUMERO.Vigente,
};

function montar(ruta = `/clientes/${CLIENTE_JUAN_ID}`, props: FichaClientePageProps = {}) {
  const cliente = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'mock' });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const router = createMemoryRouter(
    [
      { path: '/clientes/:clienteId', element: <FichaClientePage {...props} /> },
      { path: '/clientes', element: <h1>Listado</h1> },
    ],
    { initialEntries: [ruta] },
  );
  const vista = render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ApiClientProvider>,
  );
  return { router, ...vista };
}

const listaPolizas = (items: PolizaListItemResponse[], total = items.length) =>
  HttpResponse.json({ items, pagina: 1, tamanoPagina: 100, total });

function usarPolizas(items: PolizaListItemResponse[], total?: number) {
  const pedidos: URL[] = [];
  servidorMock.use(
    http.get('*/api/polizas', ({ request }) => {
      pedidos.push(new URL(request.url));
      return listaPolizas(items, total);
    }),
  );
  return pedidos;
}

function contarCuotas(respuesta: () => Response = () => HttpResponse.json([])) {
  const pedidos: string[] = [];
  servidorMock.use(
    http.get('*/api/polizas/:id/cuotas', ({ params }) => {
      pedidos.push(String(params.id));
      return respuesta();
    }),
  );
  return pedidos;
}

const regionVehiculos = () => screen.getByRole('region', { name: 'Vehículos del cliente' });
const regionPolizas = () => screen.getByRole('region', { name: 'Pólizas del cliente' });
const esperarFicha = () => screen.findByRole('heading', { level: 1, name: 'Juan Carlos Pérez' });

describe('FichaClientePage: encabezado', () => {
  it('muestra el nombre como H1, el DNI con puntos y el CUIL tal cual', async () => {
    montar();
    await esperarFicha();
    expect(screen.getByText('30.123.456')).toBeInTheDocument();
    expect(screen.getByText(juan.cuil)).toBeInTheDocument();
  });

  it('muestra el avatar con las iniciales de nombre y apellido', async () => {
    montar();
    await esperarFicha();
    expect(screen.getByText('JP')).toBeInTheDocument();
  });

  it('muestra el badge Validado si el cliente está validado en Renaper', async () => {
    montar();
    await esperarFicha();
    const renaper = screen.getByText('Renaper').closest('p')!;
    expect(within(renaper).getByText('Validado')).toBeInTheDocument();
  });

  it('muestra el badge Pendiente si no está validado', async () => {
    servidorMock.use(
      http.get('*/api/clientes/:id', () =>
        HttpResponse.json({ ...juan, validadoRenaper: false, fechaValidacionRenaper: null }),
      ),
    );
    montar();
    await esperarFicha();
    const renaper = screen.getByText('Renaper').closest('p')!;
    expect(within(renaper).getByText('Pendiente')).toBeInTheDocument();
  });

  it('no muestra Editar ni Dar de baja sin los callbacks de B-08', async () => {
    montar();
    await esperarFicha();
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Dar de baja' })).toBeNull();
  });

  it('con los callbacks de B-08 muestra los botones', async () => {
    montar(`/clientes/${CLIENTE_JUAN_ID}`, {
      onEditar: () => undefined,
      onDarDeBaja: () => undefined,
    });
    await esperarFicha();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dar de baja' })).toBeInTheDocument();
  });
});

describe('FichaClientePage: pestañas', () => {
  it('la pestaña Vehículos está activa sin ?tab=', async () => {
    montar();
    await esperarFicha();
    expect(screen.getByRole('tab', { name: 'Vehículos' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Datos' })).toHaveAttribute('aria-selected', 'false');
  });

  it('?tab=datos muestra contacto y domicilio en lectura', async () => {
    montar(`/clientes/${CLIENTE_JUAN_ID}?tab=datos`);
    await esperarFicha();
    const panel = screen.getByRole('tabpanel', { name: 'Datos' });
    expect(within(panel).getByText(juan.email)).toBeInTheDocument();
    expect(within(panel).getByText(juan.calle)).toBeInTheDocument();
    expect(within(panel).getByText(juan.provincia)).toBeInTheDocument();
    expect(within(panel).getByText('Código postal')).toBeInTheDocument();
  });

  it('una pestaña desconocida cae en Vehículos', async () => {
    montar(`/clientes/${CLIENTE_JUAN_ID}?tab=pagos`);
    await esperarFicha();
    expect(screen.getByRole('tab', { name: 'Vehículos' })).toHaveAttribute('aria-selected', 'true');
  });

  it('las flechas mueven el foco entre pestañas y la elegida queda en la URL', async () => {
    const usuario = userEvent.setup();
    const { router } = montar();
    await esperarFicha();
    screen.getByRole('tab', { name: 'Vehículos' }).focus();
    await usuario.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Datos' })).toHaveFocus();
    await waitFor(() => expect(router.state.location.search).toBe('?tab=datos'));
    await usuario.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Vehículos' })).toHaveFocus();
    await waitFor(() => expect(router.state.location.search).toBe(''));
  });

  it('las pólizas están dentro de la pestaña Vehículos', async () => {
    montar();
    await esperarFicha();
    const panel = screen.getByRole('tabpanel', { name: 'Vehículos' });
    expect(within(panel).getByRole('heading', { level: 2, name: 'Pólizas' })).toBeInTheDocument();
  });
});

describe('FichaClientePage: vehículos', () => {
  it('muestra marca modelo año, patente y tipo · uso', async () => {
    montar();
    await esperarFicha();
    const seccion = regionVehiculos();
    expect(await within(seccion).findByText('Toyota Corolla XEi 2021')).toBeInTheDocument();
    expect(within(seccion).getByText('AB123CD')).toBeInTheDocument();
    expect(within(seccion).getByText('Auto · Particular')).toBeInTheDocument();
    expect(within(seccion).getByText('DNRPA')).toBeInTheDocument();
  });

  it('pide los vehículos por clienteId sin paginar', async () => {
    const pedidos: URL[] = [];
    servidorMock.use(
      http.get('*/api/vehiculos', ({ request }) => {
        pedidos.push(new URL(request.url));
        return HttpResponse.json([]);
      }),
    );
    montar();
    await esperarFicha();
    await within(regionVehiculos()).findByText('Este cliente no tiene vehículos.');
    expect(pedidos).toHaveLength(1);
    expect(pedidos[0]!.searchParams.get('clienteId')).toBe(CLIENTE_JUAN_ID);
    expect([...pedidos[0]!.searchParams.keys()]).toEqual(['clienteId']);
  });

  it('con una póliza Vigente muestra su número y su badge', async () => {
    montar();
    await esperarFicha();
    const seccion = regionVehiculos();
    expect(await within(seccion).findByText('POL-0000001')).toBeInTheDocument();
    expect(within(seccion).getByText('Vigente')).toBeInTheDocument();
    expect(within(seccion).queryByText('Sin póliza activa')).toBeNull();
  });

  it.each([
    [ESTADO_POLIZA_NUMERO.Pendiente, 'Pendiente'],
    [ESTADO_POLIZA_NUMERO.Suspendida, 'Suspendida'],
  ] as const)(
    'una póliza con estado %i (%s) también cuenta como activa',
    async (estado, etiqueta) => {
      usarPolizas([{ ...POLIZA, estado }]);
      contarCuotas();
      montar();
      await esperarFicha();
      const seccion = regionVehiculos();
      expect(await within(seccion).findByText('POL-0000001')).toBeInTheDocument();
      expect(within(seccion).getByText(etiqueta)).toBeInTheDocument();
    },
  );

  it.each([ESTADO_POLIZA_NUMERO.Cancelada, ESTADO_POLIZA_NUMERO.Vencida] as const)(
    'con una póliza solo en estado %i muestra Sin póliza activa y Cotizar',
    async (estado) => {
      usarPolizas([{ ...POLIZA, estado }]);
      const cuotas = contarCuotas();
      montar();
      await esperarFicha();
      const seccion = regionVehiculos();
      expect(await within(seccion).findByText('Sin póliza activa')).toBeInTheDocument();
      expect(within(seccion).getByRole('link', { name: 'Cotizar' })).toBeInTheDocument();
      // Vencida y Cancelada no piden cuotas (ahorro de requests).
      expect(cuotas).toHaveLength(0);
    },
  );

  it('Cotizar enlaza a /cotizaciones/nueva con vehiculoId y clienteId', async () => {
    usarPolizas([]);
    montar();
    await esperarFicha();
    const enlace = await within(regionVehiculos()).findByRole('link', { name: 'Cotizar' });
    expect(enlace).toHaveAttribute(
      'href',
      `/cotizaciones/nueva?vehiculoId=${VEHICULO_ID}&clienteId=${CLIENTE_JUAN_ID}`,
    );
  });

  it('sin vehículos muestra el mensaje y Agregar vehículo', async () => {
    servidorMock.use(http.get('*/api/vehiculos', () => HttpResponse.json([])));
    montar();
    await esperarFicha();
    const seccion = regionVehiculos();
    expect(
      await within(seccion).findByText('Este cliente no tiene vehículos.'),
    ).toBeInTheDocument();
    expect(within(seccion).getByRole('link', { name: 'Agregar vehículo' })).toHaveAttribute(
      'href',
      `/clientes/${CLIENTE_JUAN_ID}/vehiculos/nuevo`,
    );
  });

  it('un error de vehículos no oculta el encabezado y permite reintentar', async () => {
    let intentos = 0;
    servidorMock.use(
      http.get('*/api/vehiculos', () => {
        intentos += 1;
        return intentos === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json([]);
      }),
    );
    const usuario = userEvent.setup();
    montar();
    await esperarFicha();
    const seccion = regionVehiculos();
    expect(await within(seccion).findByRole('alert')).toHaveTextContent(
      'No pudimos cargar los vehículos.',
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Juan Carlos Pérez' }),
    ).toBeInTheDocument();
    await usuario.click(within(seccion).getByRole('button', { name: 'Reintentar' }));
    expect(
      await within(seccion).findByText('Este cliente no tiene vehículos.'),
    ).toBeInTheDocument();
    expect(intentos).toBe(2);
  });
});

describe('FichaClientePage: pólizas', () => {
  it('pide las pólizas con clienteId y tamano=100', async () => {
    const pedidos = usarPolizas([POLIZA]);
    montar();
    await esperarFicha();
    await within(regionPolizas()).findByRole('table');
    expect(pedidos).toHaveLength(1);
    expect(pedidos[0]!.searchParams.get('clienteId')).toBe(CLIENTE_JUAN_ID);
    expect(pedidos[0]!.searchParams.get('tamano')).toBe('100');
    expect(pedidos[0]!.searchParams.has('estado')).toBe(false);
  });

  it('la tabla cruza el vehículo por patente sin distinguir mayúsculas ni espacios', async () => {
    usarPolizas([{ ...POLIZA, patente: 'ab 123cd' }]);
    contarCuotas();
    montar();
    await esperarFicha();
    const tabla = await within(regionPolizas()).findByRole('table');
    expect(within(tabla).getByText('Toyota Corolla XEi 2021')).toBeInTheDocument();
    expect(
      within(tabla)
        .getAllByRole('columnheader')
        .map((columna) => columna.textContent),
    ).toEqual(['Número', 'Vehículo', 'Plan', 'Vigencia', 'Estado', 'Próx. vencimiento']);
  });

  it('muestra número, plan, vigencia, estado y la fecha de la primera cuota Pendiente', async () => {
    montar();
    await esperarFicha();
    const tabla = await within(regionPolizas()).findByRole('table');
    expect(within(tabla).getByText('POL-0000001')).toBeInTheDocument();
    expect(within(tabla).getByText('RC')).toBeInTheDocument();
    expect(within(tabla).getByText('01/11/2026 a 01/05/2027')).toBeInTheDocument();
    expect(within(tabla).getByText('Vigente')).toBeInTheDocument();
    expect(await within(tabla).findByText('10/01/2027')).toBeInTheDocument();
  });

  it('una póliza sin cuotas Pendientes muestra -', async () => {
    contarCuotas(() => HttpResponse.json([]));
    montar();
    await esperarFicha();
    const tabla = await within(regionPolizas()).findByRole('table');
    await waitFor(() => {
      const fila = within(tabla).getByText('POL-0000001').closest('tr')!;
      expect(within(fila).getAllByRole('cell').at(-1)).toHaveTextContent(/^-$/);
    });
  });

  it('una póliza sin vehículo conocido muestra — en la columna Vehículo', async () => {
    usarPolizas([{ ...POLIZA, patente: 'ZZ999ZZ' }]);
    contarCuotas();
    montar();
    await esperarFicha();
    const tabla = await within(regionPolizas()).findByRole('table');
    const fila = within(tabla).getByText('POL-0000001').closest('tr')!;
    expect(within(fila).getAllByRole('cell')[1]).toHaveTextContent('—');
  });

  it('un estado fuera del mapa muestra Desconocido sin romper', async () => {
    usarPolizas([{ ...POLIZA, estado: 99 as never }]);
    montar();
    await esperarFicha();
    const tabla = await within(regionPolizas()).findByRole('table');
    expect(within(tabla).getByText('Desconocido')).toBeInTheDocument();
  });

  it('sin pólizas muestra el mensaje', async () => {
    usarPolizas([]);
    montar();
    await esperarFicha();
    expect(
      await within(regionPolizas()).findByText('Este cliente no tiene pólizas.'),
    ).toBeInTheDocument();
  });

  it('con más de 100 pólizas avisa que se muestran las primeras 100', async () => {
    usarPolizas([POLIZA], 150);
    montar();
    await esperarFicha();
    expect(
      await within(regionPolizas()).findByText('Mostrando las primeras 100 pólizas.'),
    ).toBeInTheDocument();
  });

  it('un error de pólizas no oculta el encabezado ni los vehículos', async () => {
    servidorMock.use(http.get('*/api/polizas', () => new HttpResponse(null, { status: 500 })));
    montar();
    await esperarFicha();
    expect(await within(regionPolizas()).findByRole('alert')).toHaveTextContent(
      'No pudimos cargar las pólizas.',
    );
    expect(within(regionVehiculos()).getByText('Toyota Corolla XEi 2021')).toBeInTheDocument();
    expect(within(regionVehiculos()).queryByText('Sin póliza activa')).toBeNull();
  });
});

describe('FichaClientePage: estados del cliente', () => {
  it('un cliente inexistente o inactivo muestra Cliente no encontrado y no pide vehículos', async () => {
    const pedidos: string[] = [];
    servidorMock.use(
      http.get('*/api/vehiculos', () => {
        pedidos.push('vehiculos');
        return HttpResponse.json([]);
      }),
      http.get('*/api/polizas', () => {
        pedidos.push('polizas');
        return listaPolizas([]);
      }),
    );
    montar(`/clientes/${CLIENTE_INACTIVO_ID}`);
    expect(await screen.findByText('Cliente no encontrado.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a clientes' })).toHaveAttribute(
      'href',
      '/clientes',
    );
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(pedidos).toEqual([]);
  });

  it('un error del cliente muestra Reintentar que vuelve a pedir', async () => {
    let intentos = 0;
    servidorMock.use(
      http.get('*/api/clientes/:id', () => {
        intentos += 1;
        return intentos === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(juan);
      }),
    );
    const usuario = userEvent.setup();
    montar();
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar el cliente.');
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));
    await esperarFicha();
    expect(intentos).toBe(2);
  });

  it('mientras carga muestra un esqueleto y no un spinner de página', () => {
    montar();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});

describe('FichaClientePage: rail y contenido', () => {
  it('el rail solo tiene Agregar vehículo; no hay Cuenta ni pago en caja', async () => {
    montar();
    await esperarFicha();
    const rail = within(screen.getByRole('complementary', { name: 'Acciones del cliente' }));
    expect(rail.getByRole('heading', { name: 'Acciones' })).toBeInTheDocument();
    expect(rail.getByRole('link', { name: 'Agregar vehículo' })).toHaveAttribute(
      'href',
      `/clientes/${CLIENTE_JUAN_ID}/vehiculos/nuevo`,
    );
    expect(rail.getAllByRole('link')).toHaveLength(1);
    expect(screen.queryByText('Cuenta')).toBeNull();
    expect(screen.queryByText(/Registrar pago en caja/)).toBeNull();
    expect(screen.queryByText('Nueva cotización')).toBeNull();
  });

  it('no aparecen valores de muestra fijos del diseño', async () => {
    montar();
    await esperarFicha();
    await within(regionPolizas()).findByRole('table');
    expect(screen.queryByText(/Tomás/)).toBeNull();
    expect(screen.queryByText('POL-0000042')).toBeNull();
    expect(screen.queryByText(/\$ 26\.250/)).toBeNull();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = montar();
    await esperarFicha();
    await within(regionPolizas()).findByRole('table');
    await expectSinViolacionesA11y(container);
  });
});
