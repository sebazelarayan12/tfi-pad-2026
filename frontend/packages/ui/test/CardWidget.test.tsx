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

  it('con action href es un enlace, no un botón', () => {
    render(
      <CardWidget
        title="Pago online"
        action={{ label: 'Consultar póliza', href: '/consultar-poliza' }}
      >
        contenido
      </CardWidget>,
    );
    expect(screen.getByRole('link', { name: 'Consultar póliza' })).toHaveAttribute(
      'href',
      '/consultar-poliza',
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('la acción enlace usa renderLink cuando la app lo pasa', () => {
    render(
      <CardWidget
        title="Pago online"
        action={{
          label: 'Consultar póliza',
          href: '/consultar-poliza',
          renderLink: ({ href, className, children }) => (
            <a href={href} className={className} data-router="">
              {children}
            </a>
          ),
        }}
      >
        contenido
      </CardWidget>,
    );
    expect(screen.getByRole('link', { name: 'Consultar póliza' })).toHaveAttribute('data-router');
  });

  it('el ícono del título es decorativo', () => {
    render(
      <CardWidget title="Pago online" icon={<svg data-testid="icono" />}>
        contenido
      </CardWidget>,
    );
    expect(screen.getByTestId('icono').closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 3, name: 'Pago online' })).toBeInTheDocument();
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
