import { ESTADO_CUOTA_NUMERO, type PagoCajaRequest } from '@nexa/api';
import { cajaConflictoConcurrencia } from '@nexa/api/mocks/handlers/pagos';
import { servidorMock } from '@nexa/api/mocks/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { cuota, PAGO_APROBADO, renderConProveedores } from '../test/utils';
import { CobrarVencidasButton } from './CobrarVencidasButton';

const CUOTAS = [
  cuota(8, { estado: ESTADO_CUOTA_NUMERO.Vencida }),
  cuota(6, { estado: ESTADO_CUOTA_NUMERO.Vencida }),
  cuota(7, { estado: ESTADO_CUOTA_NUMERO.Pendiente }),
  cuota(9, { estado: ESTADO_CUOTA_NUMERO.Pagada }),
];

describe('CobrarVencidasButton', () => {
  it('envía solo los ids de las cuotas vencidas, ordenados por número', async () => {
    let body: PagoCajaRequest | undefined;
    servidorMock.use(
      http.post('*/api/pagos/caja', async ({ request }) => {
        body = (await request.json()) as PagoCajaRequest;
        return HttpResponse.json(PAGO_APROBADO, { status: 201 });
      }),
    );
    renderConProveedores(<CobrarVencidasButton polizaId="poliza-1" cuotas={CUOTAS} />);

    await userEvent.click(screen.getByRole('button', { name: 'Registrar pago en caja' }));

    await waitFor(() => expect(body).toBeDefined());
    expect(body?.cuotaIds).toEqual(['cuota-6', 'cuota-8']);
  });

  it('con cuotaIds cobra solo esas cuotas y sin ids queda deshabilitado', async () => {
    let body: PagoCajaRequest | undefined;
    servidorMock.use(
      http.post('*/api/pagos/caja', async ({ request }) => {
        body = (await request.json()) as PagoCajaRequest;
        return HttpResponse.json(PAGO_APROBADO, { status: 201 });
      }),
    );
    const { rerender } = renderConProveedores(
      <CobrarVencidasButton polizaId="poliza-1" cuotas={CUOTAS} cuotaIds={[]} />,
    );
    expect(screen.getByRole('button', { name: 'Registrar pago en caja' })).toBeDisabled();

    rerender(<CobrarVencidasButton polizaId="poliza-1" cuotas={CUOTAS} cuotaIds={['cuota-8']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pago en caja' }));

    await waitFor(() => expect(body).toBeDefined());
    expect(body?.cuotaIds).toEqual(['cuota-8']);
  });

  it('no dispara ninguna request al montar y se deshabilita sin vencidas', async () => {
    const post = vi.fn();
    servidorMock.use(
      http.post('*/api/pagos/caja', () => {
        post();
        return HttpResponse.json(PAGO_APROBADO, { status: 201 });
      }),
    );
    renderConProveedores(
      <CobrarVencidasButton
        polizaId="poliza-1"
        cuotas={[cuota(1, { estado: ESTADO_CUOTA_NUMERO.Pendiente })]}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    const boton = screen.getByRole('button', { name: 'Registrar pago en caja' });
    expect(boton).toBeDisabled();
    await userEvent.click(boton);
    expect(post).not.toHaveBeenCalled();
  });

  it('un doble clic genera un solo POST', async () => {
    let resolver: (() => void) | undefined;
    const espera = new Promise<void>((resolve) => {
      resolver = resolve;
    });
    const post = vi.fn();
    servidorMock.use(
      http.post('*/api/pagos/caja', async () => {
        post();
        await espera;
        return HttpResponse.json(PAGO_APROBADO, { status: 201 });
      }),
    );
    renderConProveedores(<CobrarVencidasButton polizaId="poliza-1" cuotas={CUOTAS} />);

    const boton = screen.getByRole('button', { name: 'Registrar pago en caja' });
    await userEvent.click(boton);
    await waitFor(() => expect(boton).toHaveAttribute('aria-disabled', 'true'));
    await userEvent.click(boton);
    resolver?.();

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('muestra el detail del 400 en role alert', async () => {
    servidorMock.use(cajaConflictoConcurrencia);
    renderConProveedores(<CobrarVencidasButton polizaId="poliza-1" cuotas={CUOTAS} />);

    await userEvent.click(screen.getByRole('button', { name: 'Registrar pago en caja' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El pago o sus cuotas fueron modificados por otro cobro. Recargue los datos.',
    );
  });

  it('sin violaciones de accesibilidad', async () => {
    const { container } = renderConProveedores(
      <CobrarVencidasButton polizaId="poliza-1" cuotas={CUOTAS} />,
    );

    expect((await axe(container)).violations).toEqual([]);
  });
});
