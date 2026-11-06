import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NavItem } from './NavItem';

const indicador = (contenedor: HTMLElement) => contenedor.querySelector('[data-indicador]');

describe('NavItem', () => {
  it('inactivo: texto text-text-secondary, sin aria-current e indicador transparente', () => {
    const { container } = render(<NavItem label="Clientes" icon="users" href="/clientes" />);
    const enlace = screen.getByRole('link', { name: 'Clientes' });
    expect(enlace).toHaveClass('text-text-secondary');
    expect(enlace).not.toHaveAttribute('aria-current');
    expect(indicador(container)).toHaveClass('bg-transparent');
  });

  it('activo: aria-current="page", texto text-text-primary e indicador bg-action-primary', () => {
    const { container } = render(<NavItem label="Inicio" icon="house" href="/inicio" active />);
    const enlace = screen.getByRole('link', { name: 'Inicio' });
    expect(enlace).toHaveAttribute('aria-current', 'page');
    expect(enlace).toHaveClass('text-text-primary');
    expect(indicador(container)).toHaveClass('bg-action-primary', 'h-5', 'w-0.5');
  });

  it('sin href: no es un enlace y tiene aria-disabled="true"', () => {
    render(<NavItem label="Vehículos" icon="car" />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Vehículos').parentElement).toHaveAttribute('aria-disabled', 'true');
  });

  it('con renderLink usa el componente recibido y no un <a> propio', () => {
    render(
      <NavItem
        label="Pólizas"
        icon="file-text"
        href="/polizas"
        active
        renderLink={({ className, children, ...rest }) => (
          <button type="button" data-testid="propio" className={className} {...rest}>
            {children}
          </button>
        )}
      />,
    );
    expect(screen.queryByRole('link')).toBeNull();
    const propio = screen.getByTestId('propio');
    expect(propio).toHaveAttribute('aria-current', 'page');
    expect(propio).toHaveTextContent('Pólizas');
  });

  it('tiene las clases de foco visible de 2 px con offset de 2 px', () => {
    render(<NavItem label="Pagos" icon="receipt" href="/pagos" />);
    expect(screen.getByRole('link', { name: 'Pagos' })).toHaveClass(
      'focus-visible:outline-2',
      'focus-visible:outline-offset-2',
      'focus-visible:outline-action-primary',
    );
  });

  it('el ícono tiene aria-hidden="true"', () => {
    render(<NavItem label="Planes" icon="list" href="/planes" />);
    const svg = screen.getByRole('link', { name: 'Planes' }).querySelector('svg');
    expect(svg?.closest('span')).toHaveAttribute('aria-hidden', 'true');
  });
});
