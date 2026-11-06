import { ESTADO_CUOTA_NUMERO } from '@nexa/api';
import { cajaConflictoConcurrencia } from '@nexa/api/mocks/handlers/pagos';
import { servidorMock } from '@nexa/api/mocks/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { cuota, PAGO_APROBADO, pagoConFacturaPendiente, renderConProveedores } from '../test/utils';
import { CobroCaja } from './CobroCaja';
import { TEXTO_ERROR_RED } from './mensajesError';

function cuotasDeEjemplo() {
  return [
    cuota(1, { estado: ESTADO_CUOTA_NUMERO.Pendiente }),
    cuota(2, { estado: ESTADO_CUOTA_NUMERO.Vencida }),
    cuota(3, { estado: ESTADO_CUOTA_NUMERO.Pagada }),
    cuota(4, { estado: ESTADO_CUOTA_NUMERO.Anulada }),
  ];
}

describe('CobroCaja', () => {
  it('no muestra cuotas pagadas ni anuladas', () => {
    renderConProveedores(<CobroCaja cuotas={cuotasDeEjemplo()} etiquetaBoton="Registrar pago" />);

    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('no preselecciona ninguna cuota', () => {
    renderConProveedores(<CobroCaja cuotas={cuotasDeEjemplo()} etiquetaBoton="Registrar pago" />);

    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).not.toBeChecked();
    }
    expect(screen.getByRole('button', { name: 'Registrar pago' })).toBeDisabled();
  });

  it('no muestra total previo', async () => {
    const cuotas = [
      cuota(6, { importe: 10500, recargo: 525, estado: ESTADO_CUOTA_NUMERO.Vencida }),
      cuota(7, { importe: 10500, recargo: 525, estado: ESTADO_CUOTA_NUMERO.Vencida }),
    ];
    renderConProveedores(<CobroCaja cuotas={cuotas} etiquetaBoton="Registrar pago" />);

    await userEvent.click(screen.getByRole('checkbox', { name: /Cuota 6/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Cuota 7/ }));

    expect(screen.queryByText('Total a registrar')).not.toBeInTheDocument();
    expect(screen.queryByText(/\$\s*11\.025,00/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$\s*22\.050,00/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$\s*23\.100,00/)).not.toBeInTheDocument();
  });

  it('deshabilita el botón mientras corre el POST y no dispara un segundo request', async () => {
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
    renderConProveedores(
      <CobroCaja
        cuotas={[cuota(1, { estado: ESTADO_CUOTA_NUMERO.Pendiente })]}
        etiquetaBoton="Registrar pago"
      />,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: /Cuota 1/ }));
    const boton = screen.getByRole('button', { name: 'Registrar pago' });
    await userEvent.click(boton);

    await waitFor(() => expect(boton).toHaveAttribute('aria-disabled', 'true'));
    await userEvent.click(boton);
    resolver?.();

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('no reintenta ante un error de red', async () => {
    const post = vi.fn();
    servidorMock.use(
      http.post('*/api/pagos/caja', () => {
        post();
        return HttpResponse.error();
      }),
    );
    renderConProveedores(
      <CobroCaja
        cuotas={[cuota(1, { estado: ESTADO_CUOTA_NUMERO.Pendiente })]}
        etiquetaBoton="Registrar pago"
      />,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: /Cuota 1/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(TEXTO_ERROR_RED);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('muestra el detail del 400 en role alert', async () => {
    servidorMock.use(cajaConflictoConcurrencia);
    renderConProveedores(
      <CobroCaja
        cuotas={[cuota(1, { estado: ESTADO_CUOTA_NUMERO.Pendiente })]}
        etiquetaBoton="Registrar pago"
      />,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: /Cuota 1/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El pago o sus cuotas fueron modificados por otro cobro. Recargue los datos.',
    );
  });

  it('muestra el aviso de éxito con factura pendiente y el importe confirmado', async () => {
    servidorMock.use(
      http.post('*/api/pagos/caja', () =>
        HttpResponse.json(pagoConFacturaPendiente(22050), { status: 201 }),
      ),
    );
    renderConProveedores(
      <CobroCaja
        cuotas={[cuota(1, { estado: ESTADO_CUOTA_NUMERO.Pendiente })]}
        etiquetaBoton="Registrar pago"
      />,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: /Cuota 1/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));

    const estado = await screen.findByRole('status');
    expect(estado).toHaveTextContent('Pago registrado. La factura quedó pendiente de CAE.');
    expect(estado).toHaveTextContent(/Importe: \$\s*22\.050,00/);
  });

  it('muestra la ayuda solo si se recibe', () => {
    const { rerender } = renderConProveedores(
      <CobroCaja cuotas={cuotasDeEjemplo()} etiquetaBoton="Registrar pago" />,
    );

    expect(screen.queryByText('Se emite la factura con CAE al confirmar.')).not.toBeInTheDocument();

    rerender(
      <CobroCaja
        cuotas={cuotasDeEjemplo()}
        etiquetaBoton="Registrar pago"
        ayuda="Se emite la factura con CAE al confirmar."
      />,
    );
    expect(screen.getByText('Se emite la factura con CAE al confirmar.')).toBeInTheDocument();
  });

  it('sin violaciones de accesibilidad', async () => {
    const { container } = renderConProveedores(
      <CobroCaja
        cuotas={[
          cuota(1, { estado: ESTADO_CUOTA_NUMERO.Pendiente }),
          cuota(2, { estado: ESTADO_CUOTA_NUMERO.Vencida }),
          cuota(3, { estado: ESTADO_CUOTA_NUMERO.Pagada }),
        ]}
        etiquetaBoton="Registrar pago"
      />,
    );

    expect((await axe(container)).violations).toEqual([]);
  });
});
