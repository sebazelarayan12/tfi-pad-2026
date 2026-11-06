import { facturaNoExiste, facturaPendienteCae, PAGO_UNO_ID } from '@nexa/api/mocks/handlers/pagos';
import { servidorMock } from '@nexa/api/mocks/server';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { renderConProveedores } from '../test/utils';
import { FacturaPanel } from './FacturaPanel';

describe('FacturaPanel', () => {
  it('muestra Pendiente CAE sin CAE ni vencimiento', async () => {
    servidorMock.use(facturaPendienteCae);
    renderConProveedores(<FacturaPanel pagoId={PAGO_UNO_ID} />);

    expect(await screen.findByText('Pendiente CAE')).toBeInTheDocument();
    expect(screen.getByText('Pendiente de numeración')).toBeInTheDocument();
    expect(screen.queryByText('CAE')).not.toBeInTheDocument();
    expect(screen.queryByText('Vencimiento del CAE')).not.toBeInTheDocument();
  });

  it('muestra Facturada con CAE y vencimiento', async () => {
    renderConProveedores(<FacturaPanel pagoId={PAGO_UNO_ID} />);

    expect(await screen.findByText('Facturada')).toBeInTheDocument();
    expect(screen.getByText('18/11/2026')).toBeInTheDocument();
  });

  it('muestra el detail del 404 sin ofrecer reintento', async () => {
    servidorMock.use(facturaNoExiste);
    renderConProveedores(<FacturaPanel pagoId={PAGO_UNO_ID} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se encontró la factura del pago.',
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('sin violaciones de accesibilidad', async () => {
    const { container } = renderConProveedores(<FacturaPanel pagoId={PAGO_UNO_ID} />);

    await screen.findByText('Facturada');
    expect((await axe(container)).violations).toEqual([]);
  });
});
