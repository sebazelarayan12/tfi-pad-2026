import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Backdrop } from '../src/index';

describe('Backdrop', () => {
  it('degradado y alto mínimo', () => {
    const { container } = render(<Backdrop />);
    const fondo = container.firstElementChild;
    expect(fondo).toHaveClass('bg-backdrop', 'min-h-dvh');
    expect(fondo?.className).not.toMatch(/(^|\s)h-/);
  });

  it('renderiza children', () => {
    render(
      <Backdrop>
        <p>Contenido</p>
      </Backdrop>,
    );
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });
});
