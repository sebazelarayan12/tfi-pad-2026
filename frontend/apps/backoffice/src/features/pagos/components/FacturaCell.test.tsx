import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderConProveedores } from '../test/utils';
import { FacturaCell } from './FacturaCell';

describe('FacturaCell', () => {
  it('pendiente de CAE se muestra sin el link Reintentar', () => {
    renderConProveedores(
      <FacturaCell pagoId="p1" factura={{ numero: '', estado: 'PENDIENTE_CAE' }} />,
    );

    expect(screen.getByText('Pendiente de CAE')).toBeInTheDocument();
    expect(screen.queryByText('Reintentar')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('autorizada muestra el número de factura', () => {
    renderConProveedores(
      <FacturaCell pagoId="p1" factura={{ numero: 'A-0003-00000187', estado: 'AUTORIZADA' }} />,
    );

    expect(screen.getByText('A-0003-00000187')).toHaveClass('font-mono');
    expect(screen.getByRole('button', { name: 'Ver PDF' })).toBeInTheDocument();
  });

  it('sin factura muestra "Sin factura" con contraste de texto secundario', () => {
    renderConProveedores(<FacturaCell pagoId="p1" factura={null} />);

    const texto = screen.getByText('Sin factura');
    expect(texto).toHaveClass('text-text-secondary');
    expect(texto).not.toHaveClass('text-text-tertiary');
  });
});
