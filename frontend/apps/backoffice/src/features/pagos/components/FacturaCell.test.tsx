import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FacturaCell } from './FacturaCell';

describe('FacturaCell', () => {
  it('pendiente de CAE se muestra sin el link Reintentar', () => {
    render(<FacturaCell factura={{ numero: '', estado: 'PENDIENTE_CAE' }} />);

    expect(screen.getByText('Pendiente de CAE')).toBeInTheDocument();
    expect(screen.queryByText('Reintentar')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('autorizada muestra el número de factura', () => {
    render(<FacturaCell factura={{ numero: 'A-0003-00000187', estado: 'AUTORIZADA' }} />);

    expect(screen.getByText('A-0003-00000187')).toHaveClass('font-mono');
  });

  it('sin factura muestra "Sin factura" con contraste de texto secundario', () => {
    render(<FacturaCell factura={null} />);

    const texto = screen.getByText('Sin factura');
    expect(texto).toHaveClass('text-text-secondary');
    expect(texto).not.toHaveClass('text-text-tertiary');
  });
});
