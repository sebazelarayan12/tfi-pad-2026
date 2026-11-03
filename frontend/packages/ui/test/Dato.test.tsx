import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Dato } from '../src/index';

describe('Dato', () => {
  it('asocia label y valor como dt y dd', () => {
    render(<Dato label="Estado" value="Validado" />);
    expect(screen.getByText('Estado').tagName).toBe('DT');
    expect(screen.getByText('Validado').tagName).toBe('DD');
  });

  it('valor null muestra No disponible', () => {
    render(<Dato label="Estado" value={null} />);
    expect(screen.getByText('No disponible').tagName).toBe('DD');
  });

  it('valor cadena vacía muestra No disponible', () => {
    render(<Dato label="Estado" value="" />);
    expect(screen.getByText('No disponible').tagName).toBe('DD');
  });

  it('mono usa font-mono', () => {
    render(<Dato label="DNI" value="30111222" mono />);
    expect(screen.getByText('30111222')).toHaveClass('font-mono');
  });
});
