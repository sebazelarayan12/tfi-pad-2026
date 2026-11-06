import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { ButtonLink, type LinkRenderProps } from '../src/index';

describe('ButtonLink', () => {
  it('es un enlace con el href y el aspecto del Button primary', () => {
    render(<ButtonLink label="Consultar póliza" href="/consultar-poliza" />);
    const enlace = screen.getByRole('link', { name: 'Consultar póliza' });
    expect(enlace).toHaveAttribute('href', '/consultar-poliza');
    expect(enlace).toHaveClass(
      'bg-action-primary',
      'text-action-on-primary',
      'h-10',
      'rounded-pill',
    );
  });

  it('variante secondary y tamaño S usan los tokens del Button', () => {
    render(<ButtonLink label="Ver planes" href="#planes" variant="secondary" size="s" />);
    expect(screen.getByRole('link', { name: 'Ver planes' })).toHaveClass(
      'border-border-strong',
      'bg-surface-panel',
      'h-8',
      'text-label',
    );
  });

  it('usa renderLink cuando la app lo pasa', () => {
    const renderLink = ({ href, className, children }: LinkRenderProps) => (
      <a href={href} className={className} data-router="">
        {children}
      </a>
    );
    render(
      <ButtonLink label="Consultar póliza" href="/consultar-poliza" renderLink={renderLink} />,
    );
    expect(screen.getByRole('link', { name: 'Consultar póliza' })).toHaveAttribute('data-router');
  });

  it('el ícono es decorativo', () => {
    render(<ButtonLink label="Ir" href="/" icon={<svg data-testid="icono" />} />);
    expect(screen.getByTestId('icono').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('sin violaciones de accesibilidad', async () => {
    const { container } = render(<ButtonLink label="Consultar póliza" href="/consultar-poliza" />);
    expect((await axe(container)).violations).toEqual([]);
  });
});
