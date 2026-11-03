import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Shell } from '../src/index';

describe('Shell', () => {
  it('clases rounded-shell y shadow-shell', () => {
    render(
      <Shell>
        <p>Contenido</p>
      </Shell>,
    );
    const contenido = screen.getByText('Contenido');
    expect(contenido.parentElement).toHaveClass('rounded-shell', 'shadow-shell');
  });
});
