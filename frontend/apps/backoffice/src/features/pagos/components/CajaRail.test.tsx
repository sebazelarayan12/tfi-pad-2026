import { ESTADO_CUOTA_NUMERO } from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PAGO_APROBADO, renderConProveedores } from '../test/utils';
import { cuotaDePoliza, pagina, POLIZA_57, URL_POLIZAS } from '../test/fixturesListado';
import { CajaRail } from './CajaRail';

const flags = vi.hoisted(() => ({ busqueda: true }));
vi.mock('../config', () => ({
  get BUSQUEDA_POLIZA_NUMERO_DISPONIBLE() {
    return flags.busqueda;
  },
}));

const URL_CUOTAS = '*/api/polizas/:id/cuotas';
const URL_COBRO = '*/api/pagos/caja';

function servirPoliza() {
  const busquedas: URLSearchParams[] = [];
  servidorMock.use(
    http.get(URL_POLIZAS, ({ request }) => {
      busquedas.push(new URL(request.url).searchParams);
      const numero = new URL(request.url).searchParams.get('numero');
      return HttpResponse.json(pagina(numero === 'POL-0000057' ? [POLIZA_57] : [], 1, 1));
    }),
    http.get(URL_CUOTAS, () =>
      HttpResponse.json([
        cuotaDePoliza(6, ESTADO_CUOTA_NUMERO.Pagada),
        cuotaDePoliza(7, ESTADO_CUOTA_NUMERO.Anulada),
        cuotaDePoliza(8, ESTADO_CUOTA_NUMERO.Vencida),
        cuotaDePoliza(9, ESTADO_CUOTA_NUMERO.Pendiente),
      ]),
    ),
  );
  return busquedas;
}

async function buscar(numero: string) {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText('Póliza'), `${numero}{Enter}`);
  return usuario;
}

beforeEach(() => {
  flags.busqueda = true;
});

describe('CajaRail: búsqueda de póliza', () => {
  it('un formato inválido no llama a la API y muestra el mensaje', async () => {
    const busquedas = servirPoliza();
    renderConProveedores(<CajaRail />);

    await buscar('POL-123');

    expect(await screen.findByText('Usá el formato POL-0000001.')).toBeInTheDocument();
    expect(screen.getByLabelText('Póliza')).toHaveAttribute('aria-invalid', 'true');
    expect(busquedas).toHaveLength(0);
  });

  it('un número válido carga solo las cuotas impagas', async () => {
    servirPoliza();
    renderConProveedores(<CajaRail />);

    await buscar('POL-0000057');

    expect(await screen.findByRole('checkbox', { name: /Cuota 8/ })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Cuota 9/ })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Cuota 6/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Cuota 7/ })).not.toBeInTheDocument();
    expect(screen.getByText('Cuotas impagas', { selector: 'h4' })).toBeInTheDocument();
  });

  it('no preselecciona ninguna cuota', async () => {
    servirPoliza();
    renderConProveedores(<CajaRail />);
    await buscar('POL-0000057');

    for (const casilla of await screen.findAllByRole('checkbox')) {
      expect(casilla).not.toBeChecked();
    }
    expect(screen.getByRole('button', { name: 'Registrar pago' })).toBeDisabled();
  });

  it('el cliente muestra "No disponible"', async () => {
    servirPoliza();
    renderConProveedores(<CajaRail />);
    await buscar('POL-0000057');

    await screen.findByRole('checkbox', { name: /Cuota 8/ });
    expect(screen.getByText('Cliente').closest('dl')).toHaveTextContent('No disponible');
  });

  it('muestra la ayuda de emisión de la factura', async () => {
    servirPoliza();
    renderConProveedores(<CajaRail />);
    await buscar('POL-0000057');

    expect(
      await screen.findByText('Se emite la factura con CAE al confirmar.'),
    ).toBeInTheDocument();
  });

  it('Registrar pago envía el id de la cuota marcada', async () => {
    servirPoliza();
    let cuerpo: unknown;
    servidorMock.use(
      http.post(URL_COBRO, async ({ request }) => {
        cuerpo = await request.json();
        return HttpResponse.json(PAGO_APROBADO, { status: 201 });
      }),
    );
    renderConProveedores(<CajaRail />);
    const usuario = await buscar('POL-0000057');

    await usuario.click(await screen.findByRole('checkbox', { name: /Cuota 8/ }));
    await usuario.click(screen.getByRole('button', { name: 'Registrar pago' }));

    await waitFor(() => expect(cuerpo).toEqual({ cuotaIds: ['cuota-8'] }));
    expect(await screen.findByText('Pago registrado.')).toBeInTheDocument();
  });

  it('un número que no existe muestra el mensaje y no carga cuotas', async () => {
    servirPoliza();
    renderConProveedores(<CajaRail />);

    await buscar('POL-0000999');

    expect(
      await screen.findByText('No se encontró ninguna póliza con ese número.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('también busca al salir del campo (blur)', async () => {
    const busquedas = servirPoliza();
    const usuario = userEvent.setup();
    renderConProveedores(<CajaRail />);

    await usuario.type(screen.getByLabelText('Póliza'), 'POL-0000057');
    await usuario.tab();

    expect(await screen.findByRole('checkbox', { name: /Cuota 8/ })).toBeInTheDocument();
    expect(busquedas).toHaveLength(1);
  });

  it('el número se escribe en fuente mono', () => {
    renderConProveedores(<CajaRail />);

    expect(screen.getByLabelText('Póliza')).toHaveClass('font-mono');
  });
});

describe('CajaRail: búsqueda desactivada (RV-D29)', () => {
  it('con la constante en false no hay campo, ni request, ni cuotas', () => {
    flags.busqueda = false;
    const busquedas = servirPoliza();
    renderConProveedores(<CajaRail />);

    expect(screen.getByText('Registrar pago en caja')).toBeInTheDocument();
    expect(screen.getByText('Todavía no se puede buscar por número.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Póliza')).not.toBeInTheDocument();
    expect(screen.queryByText('Cuotas impagas')).not.toBeInTheDocument();
    expect(busquedas).toHaveLength(0);
  });
});
