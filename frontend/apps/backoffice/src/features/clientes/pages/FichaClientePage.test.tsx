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
import { Toaster } from '@nexa/ui';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { FichaClientePage } from './FichaClientePage';

const juan = clientesFixture[0]!.cliente;

const POLIZA: PolizaListItemResponse = {
  id: 'd1000000-0000-0000-0000-000000000001',
  numero: 'POL-0000001',
  clienteId: CLIENTE_JUAN_ID,
  clienteNombre: 'Juan Carlos Pérez',
  patente: 'AB123CD',
  vehiculoMarca: 'Toyota',
  vehiculoModelo: 'Corolla XEi',
  vehiculoAnio: 2021,
  codigoPlan: 'RC',
  primaMensual: 12000,
  fechaInicio: '2026-11-01',
  fechaFin: '2027-05-01',
  estado: ESTADO_POLIZA_NUMERO.Vigente,
  proximoVencimiento: null,
};

function montar(ruta = `/clientes/${CLIENTE_JUAN_ID}`) {
  const cliente = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'mock' });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const router = createMemoryRouter(
    [
      { path: '/clientes/:clienteId', element: <FichaClientePage /> },
      { path: '/clientes', element: <h1>Listado</h1> },
    ],
    { initialEntries: [ruta] },
  );
  const vista = render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
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

const endpointCliente = '*/api/clientes/' + CLIENTE_JUAN_ID;
const problema = (status: number, detail: string) => HttpResponse.json({ detail }, { status });

async function abrirEdicion() {
  const usuario = userEvent.setup();
  const vista = montar(`/clientes/${CLIENTE_JUAN_ID}?tab=datos`);
  await usuario.click(await screen.findByRole('button', { name: 'Editar' }));
  const dialogo = screen.getByRole('dialog', { name: 'Editar contacto y domicilio' });
  return { ...vista, usuario, dialogo };
}

async function abrirBaja() {
  const usuario = userEvent.setup();
  const vista = montar();
  const boton = await screen.findByRole('button', { name: 'Dar de baja' });
  await usuario.click(boton);
  const dialogo = screen.getByRole('alertdialog', { name: '¿Dar de baja a Juan Carlos Pérez?' });
  return { ...vista, usuario, dialogo, boton };
}

describe('B-08 · edición de contacto y domicilio', () => {
  it('precarga los siete campos, deja afuera la identidad y pasa axe', async () => {
    const { dialogo, usuario } = await abrirEdicion();
    const dentro = within(dialogo);
    for (const [etiqueta, valor] of [
      ['Email', juan.email],
      ['Teléfono', juan.telefono ?? ''],
      ['Calle', juan.calle],
      ['Número', juan.numero],
      ['Localidad', juan.localidad],
      ['Provincia', juan.provincia],
      ['Código postal', juan.codigoPostal],
    ]) {
      expect(dentro.getByLabelText(etiqueta)).toHaveValue(valor);
    }
    expect(dentro.queryByLabelText(/DNI|Nombre|Apellido|CUIL|Nacimiento|Sexo/i)).toBeNull();
    expect(dentro.getByLabelText('Email')).toHaveFocus();
    await expectSinViolacionesA11y(dialogo);
    await usuario.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Editar' })).toHaveFocus();
  });

  it.each([
    ['Email', 'incorrecto', 'El email no tiene un formato válido.'],
    ['Código postal', '12345678901', 'Usá hasta 10 caracteres.'],
  ])('valida %s antes de enviar', async (campo, valor, mensaje) => {
    let pedidos = 0;
    servidorMock.use(
      http.put(endpointCliente, () => {
        pedidos++;
        return HttpResponse.json(juan);
      }),
    );
    const { dialogo, usuario } = await abrirEdicion();
    const dentro = within(dialogo);
    const control = dentro.getByLabelText(campo);
    await usuario.clear(control);
    await usuario.type(control, valor);
    await usuario.click(dentro.getByRole('button', { name: 'Guardar cambios' }));
    expect(await dentro.findByText(mensaje)).toBeInTheDocument();
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(pedidos).toBe(0);
  });

  it('envía exactamente siete campos una vez y actualiza la ficha al guardar', async () => {
    let actual = juan;
    const cuerpos: unknown[] = [];
    let responder!: () => void;
    const espera = new Promise<void>((resolver) => {
      responder = resolver;
    });
    servidorMock.use(
      http.get(endpointCliente, () => HttpResponse.json(actual)),
      http.put(endpointCliente, async ({ request }) => {
        cuerpos.push(await request.json());
        await espera;
        actual = { ...juan, telefono: '1133334444' };
        return HttpResponse.json(actual);
      }),
    );
    const { dialogo, usuario } = await abrirEdicion();
    const dentro = within(dialogo);
    const telefono = dentro.getByLabelText('Teléfono');
    await usuario.clear(telefono);
    await usuario.type(telefono, '1133334444');
    const guardar = dentro.getByRole('button', { name: 'Guardar cambios' });
    await usuario.dblClick(guardar);
    try {
      expect(guardar).toHaveAttribute('aria-busy', 'true');
      expect(telefono).toBeDisabled();
      await usuario.keyboard('{Escape}');
      expect(dialogo).toBeInTheDocument();
      await waitFor(() =>
        expect(cuerpos).toEqual([
          {
            email: juan.email,
            telefono: '1133334444',
            calle: juan.calle,
            numero: juan.numero,
            localidad: juan.localidad,
            provincia: juan.provincia,
            codigoPostal: juan.codigoPostal,
          },
        ]),
      );
    } finally {
      responder();
    }
    expect(await screen.findByText('Datos actualizados.')).toBeInTheDocument();
    expect(screen.getByText('1133334444')).toBeInTheDocument();
    expect(dialogo).not.toBeInTheDocument();
  });

  it('muestra el detalle del 400 sin prefijo ni campo marcado', async () => {
    servidorMock.use(
      http.put(endpointCliente, () => problema(400, 'RN01: El email ya está en uso.')),
    );
    const { dialogo, usuario } = await abrirEdicion();
    const dentro = within(dialogo);
    await usuario.click(dentro.getByRole('button', { name: 'Guardar cambios' }));
    expect(await dentro.findByRole('alert')).toHaveTextContent(/^El email ya está en uso\.$/);
    expect(dentro.getByLabelText('Email')).toHaveValue(juan.email);
    expect(dentro.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
  });

  it('vuelve a consultar el detalle si la respuesta del PUT es parcial', async () => {
    let actual = juan;
    servidorMock.use(
      http.get(endpointCliente, () => HttpResponse.json(actual)),
      http.put(endpointCliente, () => {
        actual = { ...juan, telefono: '1133334444' };
        return HttpResponse.json({ id: juan.id });
      }),
    );
    const { dialogo, usuario } = await abrirEdicion();
    await usuario.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('1133334444')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Juan Carlos Pérez' })).toBeInTheDocument();
    expect(dialogo).not.toBeInTheDocument();
  });

  it('cierra la edición si el cliente dejó de existir', async () => {
    servidorMock.use(http.put(endpointCliente, () => problema(404, 'Ya no existe.')));
    const { dialogo, usuario } = await abrirEdicion();
    await usuario.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Cliente no encontrado.')).toBeInTheDocument();
    expect(dialogo).not.toBeInTheDocument();
  });
});

describe('B-08 · baja', () => {
  it('enfoca Cancelar y Escape devuelve el foco sin enviar', async () => {
    let pedidos = 0;
    servidorMock.use(
      http.delete(endpointCliente, () => {
        pedidos++;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { dialogo, usuario, boton } = await abrirBaja();
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    await expectSinViolacionesA11y(dialogo);
    await usuario.keyboard('{Escape}');
    expect(dialogo).not.toBeInTheDocument();
    expect(boton).toHaveFocus();
    expect(pedidos).toBe(0);
  });

  it.each([
    [204, 'exito', 'Cliente dado de baja.'],
    [404, 'advertencia', 'Cliente no encontrado.'],
  ])('con %s vuelve al listado con aviso y un solo DELETE', async (status, tipo, texto) => {
    let pedidos = 0;
    servidorMock.use(
      http.delete(endpointCliente, () => {
        pedidos++;
        return status === 204 ? new HttpResponse(null, { status }) : problema(status, texto);
      }),
    );
    const { dialogo, usuario, router } = await abrirBaja();
    await usuario.dblClick(within(dialogo).getByRole('button', { name: 'Dar de baja' }));
    await screen.findByRole('heading', { name: 'Listado' });
    expect(router.state.location.state).toEqual({ aviso: { tipo, texto } });
    expect(pedidos).toBe(1);
  });

  it.each([
    [400, 'El cliente tiene una póliza activa.'],
    [500, 'No pudimos dar de baja al cliente. Probá de nuevo.'],
    [0, 'No pudimos dar de baja al cliente. Probá de nuevo.'],
  ])('con error %s muestra el mensaje en el diálogo sin reintentar', async (status, texto) => {
    let pedidos = 0;
    servidorMock.use(
      http.delete(endpointCliente, () => {
        pedidos++;
        return status
          ? problema(status, 'RN15: El cliente tiene una póliza activa.')
          : HttpResponse.error();
      }),
    );
    const { dialogo, usuario } = await abrirBaja();
    await usuario.click(within(dialogo).getByRole('button', { name: 'Dar de baja' }));
    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(texto);
    expect(pedidos).toBe(1);
  });
});

describe('B-08 · reintento de Renaper', () => {
  const endpoint = endpointCliente + '/validar-renaper';

  function clientePendiente() {
    servidorMock.use(
      http.get(endpointCliente, () =>
        HttpResponse.json({ ...juan, validadoRenaper: false, fechaValidacionRenaper: null }),
      ),
    );
  }

  it('ofrece el botón solo si el cliente está pendiente y actualiza el badge al validar', async () => {
    clientePendiente();
    let responder!: () => void;
    const espera = new Promise<void>((resolver) => {
      responder = resolver;
    });
    servidorMock.use(
      http.post(endpoint, async () => {
        await espera;
        return HttpResponse.json({ ...juan, validadoRenaper: true });
      }),
    );
    const usuario = userEvent.setup();
    montar();
    const boton = await screen.findByRole('button', { name: 'Validar en Renaper' });
    await usuario.click(boton);
    try {
      expect(boton).toBeDisabled();
      expect(boton).toHaveAttribute('aria-busy', 'true');
    } finally {
      responder();
    }
    expect(await screen.findByText('Cliente validado en Renaper.')).toBeInTheDocument();
    const renaper = screen.getByText('Renaper').closest('p')!;
    expect(within(renaper).getByText('Validado')).toBeInTheDocument();
    expect(boton).not.toBeInTheDocument();
  });

  it.each([
    [400, 'La persona no figura en Renaper.'],
    [404, 'Cliente no encontrado.'],
    [502, 'Renaper no responde. Probá de nuevo más tarde.'],
    [0, 'Renaper no responde. Probá de nuevo más tarde.'],
  ])('con error %s muestra el mensaje y permite otro intento manual', async (status, texto) => {
    clientePendiente();
    let pedidos = 0;
    servidorMock.use(
      http.post(endpoint, () => {
        pedidos++;
        return status
          ? problema(status, 'RN02: La persona no figura en Renaper.')
          : HttpResponse.error();
      }),
    );
    const usuario = userEvent.setup();
    montar();
    const boton = await screen.findByRole('button', { name: 'Validar en Renaper' });
    await usuario.click(boton);
    expect(await screen.findByText(texto)).toBeInTheDocument();
    expect(boton).toBeEnabled();
    expect(pedidos).toBe(1);
  });
});

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
    expect(screen.queryByRole('button', { name: 'Validar en Renaper' })).not.toBeInTheDocument();
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

  it('ofrece Editar y Dar de baja en la ficha cargada', async () => {
    montar();
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
