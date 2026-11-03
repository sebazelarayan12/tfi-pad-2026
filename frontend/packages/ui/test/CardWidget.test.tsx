import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { CardWidget } from '../src/index';

describe('CardWidget', () => {
  it('el título es un h3', () => {
    render(<CardWidget title="Pago">contenido</CardWidget>);
    expect(screen.getByRole('heading', { level: 3, name: 'Pago' })).toBeInTheDocument();
  });

  it('renderiza children', () => {
    render(<CardWidget title="Pago">Detalle del pago</CardWidget>);
    expect(screen.getByText('Detalle del pago')).toBeInTheDocument();
  });

  it('sin action no hay botón', () => {
    render(<CardWidget title="Pago">contenido</CardWidget>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('con action llama onClick', async () => {
    const onClick = vi.fn();
    render(
      <CardWidget title="Pago" action={{ label: 'Abrir', onClick }}>
        contenido
      </CardWidget>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('el ícono de la acción es decorativo', () => {
    render(
      <CardWidget title="Pago" action={{ label: 'Abrir', onClick: () => {} }}>
        contenido
      </CardWidget>,
    );
    const boton = screen.getByRole('button', { name: 'Abrir' });
    expect(boton).toHaveAttribute('type', 'button');
    expect(boton.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('sin violaciones de accesibilidad', async () => {
    const { container } = render(
      <CardWidget title="Pago" action={{ label: 'Abrir', onClick: () => {} }}>
        contenido
      </CardWidget>,
    );
    expect((await axe(container)).violations).toEqual([]);
  });
});
