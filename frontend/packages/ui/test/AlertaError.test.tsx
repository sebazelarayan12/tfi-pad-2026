import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { AlertaError } from '../src/index';

describe('AlertaError', () => {
  it('tiene role alert', () => {
    render(<AlertaError>Algo salió mal.</AlertaError>);
    expect(screen.getByRole('alert')).toHaveTextContent('Algo salió mal.');
  });

  it('el ícono es decorativo', () => {
    render(<AlertaError>Algo salió mal.</AlertaError>);
    const icono = screen.getByRole('alert').querySelector('svg');
    expect(icono?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('colores de estado cancelada', () => {
    render(<AlertaError>Algo salió mal.</AlertaError>);
    expect(screen.getByRole('alert')).toHaveClass(
      'bg-status-cancelada-bg',
      'text-status-cancelada-text',
    );
  });

  it('sin violaciones de accesibilidad', async () => {
    const { container } = render(<AlertaError>Algo salió mal.</AlertaError>);
    expect((await axe(container)).violations).toEqual([]);
  });
});
