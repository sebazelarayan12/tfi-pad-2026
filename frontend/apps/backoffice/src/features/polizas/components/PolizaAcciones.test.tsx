import {
  ApiClientProvider,
  createApiClient,
  type CuotaResponse,
  type CuponPagoFacilResponse,
  type PolizaDetalleResponse,
} from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { Toaster } from '@nexa/ui';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { PolizaAcciones } from './PolizaAcciones';

const ID = 'd1000000-0000-0000-0000-000000000001';
const CODIGO = '123450120000020261210000000100112600001026';

const cuota = (numero: number, estado: number): CuotaResponse => ({
  id: `q${numero}`,
  numero,
  importe: 10500,
  recargo: 0,
  fechaVencimiento: '2026-12-10',
  estado: estado as CuotaResponse['estado'],
  fechaPago: null,
});

function poliza(parcial: Partial<PolizaDetalleResponse> = {}): PolizaDetalleResponse {
  return {
    id: ID,
    numero: 'POL-0000057',
    clienteId: 'c1',
    vehiculoId: 'v1',
    patente: 'AB123CD',
    marca: 'Toyota',
    modelo: 'Corolla',
    planId: 'p1',
    codigoPlan: 'TC',
    nombrePlan: 'Terceros Completo',
    cotizacionId: null,
    primaMensual: 19800,
    vigenciaMeses: 12,
    fechaEmision: '2026-11-01T14:03:00',
    fechaInicio: '2026-11-01',
    fechaFin: '2027-11-01',
    estado: 1,
    cuotas: [cuota(1, 2), cuota(2, 0), cuota(3, 0)],
    ...parcial,
  };
}

const problema = (status: number, cuerpo: object) =>
  HttpResponse.json(cuerpo, { status, headers: { 'Content-Type': 'application/problem+json' } });

function cuponDe(cuotaId: string): CuponPagoFacilResponse {
  return {
    cuotaId,
    numeroPoliza: 'POL-0000057',
    numeroCuota: 2,
    importePrimerVencimiento: 10500,
    fechaPrimerVencimiento: '2026-12-10',
    importeSegundoVencimiento: 11025,
    fechaSegundoVencimiento: '2026-12-20',
    codigoBarras: CODIGO,
  };
}

function servirCupon() {
  const pedidos: string[] = [];
  servidorMock.use(
    http.get('*/api/pagofacil/cuotas/:cuotaId/cupon', ({ params }) => {
      pedidos.push(String(params.cuotaId));
      return HttpResponse.json(cuponDe(String(params.cuotaId)));
    }),
  );
  return pedidos;
}

function servirCancelar(responder?: () => Response | Promise<Response>) {
  const cuerpos: unknown[] = [];
  servidorMock.use(
    http.post('*/api/polizas/:id/cancelar', async ({ request }) => {
      cuerpos.push(await request.json());
      return responder ? responder() : HttpResponse.json(poliza({ estado: 3 }));
    }),
  );
  return cuerpos;
}

function montar(datos: PolizaDetalleResponse, queryClient?: QueryClient) {
  const cliente = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'token' });
  const qc = queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={qc}>
        <PolizaAcciones poliza={datos} />
        <Toaster />
      </QueryClientProvider>
    </ApiClientProvider>
  );
}

function renderizar(datos = poliza(), queryClient?: QueryClient) {
  return render(montar(datos, queryClient));
}

const botonCancelar = () => screen.getByRole('button', { name: 'Cancelar póliza' });
const botonCupon = () => screen.getByRole('button', { name: 'Cupón Pago Fácil' });

async function abrirDialogo(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.click(botonCancelar());
  return screen.getByRole('dialog');
}

describe('PolizaAcciones: habilitación', () => {
  it.each([
    [0, true, true],
    [1, true, true],
    [2, true, true],
    [3, false, false],
    [4, false, true],
  ])('estado %i: cancelar=%s, cupón=%s', (estado, cancelar, cupon) => {
    renderizar(poliza({ estado: estado as PolizaDetalleResponse['estado'] }));
    expect(botonCancelar().getAttribute('aria-disabled') === 'true').toBe(!cancelar);
    expect(botonCupon().getAttribute('aria-disabled') === 'true').toBe(!cupon);
  });

  it('sin cuotas elegibles el cupón está deshabilitado y no hace request', async () => {
    const pedidos = servirCupon();
    const usuario = userEvent.setup();
    renderizar(poliza({ cuotas: [cuota(1, 2), cuota(2, 3)] }));
    expect(botonCupon()).toHaveAttribute('aria-disabled', 'true');
    await usuario.click(botonCupon());
    expect(pedidos).toHaveLength(0);
  });

  it('Registrar pago en caja es el primer botón, se deshabilita sin cuotas Vencida y no pide nada al montar', () => {
    let cobros = 0;
    servidorMock.use(
      http.post('*/api/pagos/caja', () => {
        cobros += 1;
        return HttpResponse.json({});
      }),
    );
    renderizar();
    const grupo = screen.getByRole('group', { name: 'Acciones de la póliza' });
    const botones = within(grupo).getAllByRole('button');
    expect(botones[0]).toHaveAccessibleName('Registrar pago en caja');
    expect(botones[0]).toBeDisabled();
    expect(botones[0]).toHaveAttribute('aria-disabled', 'true');
    expect(cobros).toBe(0);
  });

  it('Registrar pago en caja se habilita con una cuota Vencida', () => {
    renderizar(poliza({ cuotas: [cuota(1, 2), cuota(2, 1)] }));
    expect(screen.getByRole('button', { name: 'Registrar pago en caja' })).toBeEnabled();
  });
});

describe('CancelarPolizaDialog', () => {
  it('tiene role dialog, aria-modal y el título asociado', async () => {
    const usuario = userEvent.setup();
    renderizar();
    const dialogo = await abrirDialogo(usuario);
    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleName('Cancelar póliza POL-0000057');
    expect(screen.getByLabelText('Motivo de cancelación')).toBeInTheDocument();
    expect(screen.getByText('0 de 200')).toBeInTheDocument();
  });

  it('el foco inicial está en el motivo', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await abrirDialogo(usuario);
    expect(screen.getByLabelText('Motivo de cancelación')).toHaveFocus();
  });

  it('confirmar está deshabilitado con motivo vacío o de espacios y no hace request', async () => {
    const cuerpos = servirCancelar();
    const usuario = userEvent.setup();
    renderizar();
    await abrirDialogo(usuario);
    const confirmar = screen.getByRole('button', { name: 'Confirmar cancelación' });
    expect(confirmar).toBeDisabled();
    await usuario.type(screen.getByLabelText('Motivo de cancelación'), '   ');
    expect(confirmar).toBeDisabled();
    await usuario.click(confirmar);
    expect(cuerpos).toHaveLength(0);
  });

  it('con 201 caracteres muestra el error de largo y deshabilita confirmar', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await abrirDialogo(usuario);
    await usuario.click(screen.getByLabelText('Motivo de cancelación'));
    await usuario.paste('a'.repeat(201));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'El motivo no puede tener más de 200 caracteres.',
    );
    expect(screen.getByRole('button', { name: 'Confirmar cancelación' })).toBeDisabled();
  });

  it('envía { motivo } recortado', async () => {
    const cuerpos = servirCancelar();
    const usuario = userEvent.setup();
    renderizar();
    await abrirDialogo(usuario);
    await usuario.type(screen.getByLabelText('Motivo de cancelación'), '  Vendió el auto  ');
    await usuario.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));
    await waitFor(() => expect(cuerpos).toEqual([{ motivo: 'Vendió el auto' }]));
  });

  it('el doble clic envía una sola request', async () => {
    const cuerpos = servirCancelar(async () => {
      await delay(50);
      return HttpResponse.json(poliza({ estado: 3 }));
    });
    const usuario = userEvent.setup();
    renderizar();
    await abrirDialogo(usuario);
    await usuario.type(screen.getByLabelText('Motivo de cancelación'), 'Motivo');
    const confirmar = screen.getByRole('button', { name: 'Confirmar cancelación' });
    await usuario.dblClick(confirmar);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(cuerpos).toHaveLength(1);
  });

  it('un error de red no reintenta y muestra el mensaje de confirmación fallida', async () => {
    let intentos = 0;
    servidorMock.use(
      http.post('*/api/polizas/:id/cancelar', () => {
        intentos += 1;
        return HttpResponse.error();
      }),
    );
    const usuario = userEvent.setup();
    renderizar();
    await abrirDialogo(usuario);
    await usuario.type(screen.getByLabelText('Motivo de cancelación'), 'Motivo');
    await usuario.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo confirmar la cancelación. Recargá la póliza para ver su estado.',
    );
    expect(intentos).toBe(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('un 400 de errors.motivo muestra el texto propio y no el del back en inglés', async () => {
    servirCancelar(() =>
      problema(400, {
        status: 400,
        title: 'One or more validation errors occurred.',
        errors: { Motivo: ['The Motivo field is required.'] },
      }),
    );
    const usuario = userEvent.setup();
    renderizar();
    await abrirDialogo(usuario);
    await usuario.type(screen.getByLabelText('Motivo de cancelación'), 'Motivo');
    await usuario.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(
      'El motivo no puede tener más de 200 caracteres.',
    );
    expect(screen.queryByText(/The Motivo field/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Motivo de cancelación')).toHaveAttribute('aria-invalid', 'true');
  });

  it('un 400 con detail de transición inválida se muestra dentro del diálogo', async () => {
    servirCancelar(() =>
      problema(400, {
        status: 400,
        detail: 'No se puede pasar una póliza de Vencida a Cancelada.',
      }),
    );
    const usuario = userEvent.setup();
    renderizar();
    await abrirDialogo(usuario);
    await usuario.type(screen.getByLabelText('Motivo de cancelación'), 'Motivo');
    await usuario.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se puede pasar una póliza de Vencida a Cancelada.',
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('un 404 con detail se muestra dentro del diálogo', async () => {
    servirCancelar(() => problema(404, { status: 404, detail: `La póliza ${ID} no existe.` }));
    const usuario = userEvent.setup();
    renderizar();
    await abrirDialogo(usuario);
    await usuario.type(screen.getByLabelText('Motivo de cancelación'), 'Motivo');
    await usuario.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(`La póliza ${ID} no existe.`);
  });

  it('el éxito cierra el diálogo y avisa con un toast', async () => {
    servirCancelar();
    const usuario = userEvent.setup();
    renderizar();
    await abrirDialogo(usuario);
    await usuario.type(screen.getByLabelText('Motivo de cancelación'), 'Motivo');
    await usuario.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Póliza cancelada.')).toBeInTheDocument();
  });

  it('Tab y Shift+Tab no salen del diálogo', async () => {
    const usuario = userEvent.setup();
    renderizar();
    const dialogo = await abrirDialogo(usuario);
    await usuario.type(screen.getByLabelText('Motivo de cancelación'), 'Motivo');
    const confirmar = screen.getByRole('button', { name: 'Confirmar cancelación' });
    confirmar.focus();
    await usuario.tab();
    expect(dialogo).toContainElement(document.activeElement as HTMLElement);
    expect(screen.getByLabelText('Motivo de cancelación')).toHaveFocus();
    await usuario.tab({ shift: true });
    expect(confirmar).toHaveFocus();
  });

  it('Escape cierra y devuelve el foco a Cancelar póliza', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await abrirDialogo(usuario);
    await usuario.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(botonCancelar()).toHaveFocus();
  });

  it('Volver cierra sin enviar', async () => {
    const cuerpos = servirCancelar();
    const usuario = userEvent.setup();
    renderizar();
    await abrirDialogo(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(cuerpos).toHaveLength(0);
  });

  it('a11y: sin violaciones con el diálogo abierto', async () => {
    const usuario = userEvent.setup();
    const { container } = renderizar();
    await abrirDialogo(usuario);
    await expectSinViolacionesA11y(container);
  });
});

describe('CuponPanel', () => {
  it('muestra la cuota de menor número, los 42 dígitos y los dos importes con su fecha', async () => {
    const pedidos = servirCupon();
    const usuario = userEvent.setup();
    renderizar();
    expect(screen.queryByText('Cupón de Pago Fácil')).not.toBeInTheDocument();
    await usuario.click(botonCupon());
    expect(await screen.findByText(CODIGO)).toHaveClass('font-mono');
    expect(pedidos).toEqual(['q2']);
    expect(screen.getByText('Cuota 2 de 12')).toBeInTheDocument();
    expect(screen.getByText(/10\.500,00.* el 10\/12\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/11\.025,00.* el 20\/12\/2026/)).toBeInTheDocument();
  });

  it('cada clic hace una request nueva', async () => {
    const pedidos = servirCupon();
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(botonCupon());
    await screen.findByText(CODIGO);
    await usuario.click(botonCupon());
    await waitFor(() => expect(pedidos).toHaveLength(2));
  });

  it('no se guarda entre montajes: al volver a montar no hay request ni cupón', async () => {
    const pedidos = servirCupon();
    const usuario = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const primero = renderizar(poliza(), queryClient);
    await usuario.click(botonCupon());
    await screen.findByText(CODIGO);
    primero.unmount();
    renderizar(poliza(), queryClient);
    await new Promise((resolver) => setTimeout(resolver, 20));
    expect(pedidos).toHaveLength(1);
    expect(screen.queryByText(CODIGO)).not.toBeInTheDocument();
  });

  it('un 400 muestra el detail tal cual', async () => {
    servidorMock.use(
      http.get('*/api/pagofacil/cuotas/:cuotaId/cupon', () =>
        problema(400, {
          status: 400,
          detail: 'El importe 100000.00 no entra en el código de Pago Fácil.',
        }),
      ),
    );
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(botonCupon());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El importe 100000.00 no entra en el código de Pago Fácil.',
    );
  });

  it('copiar envía los 42 dígitos sin espacios', async () => {
    servirCupon();
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(botonCupon());
    await screen.findByText(CODIGO);
    await usuario.click(screen.getByRole('button', { name: 'Copiar código' }));
    expect(await navigator.clipboard.readText()).toBe(CODIGO);
    expect(CODIGO).toHaveLength(42);
  });

  it('copiar sin permiso muestra el mensaje y la pantalla sigue estable', async () => {
    servirCupon();
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(botonCupon());
    await screen.findByText(CODIGO);
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'));
    await usuario.click(screen.getByRole('button', { name: 'Copiar código' }));
    expect(
      await screen.findByText('No se pudo copiar. Seleccionalo y copialo a mano.'),
    ).toBeInTheDocument();
    expect(screen.getByText(CODIGO)).toBeInTheDocument();
  });
});
