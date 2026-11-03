import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { LogoNexa } from '../src/index';

describe('LogoNexa', () => {
  it('muestra el wordmark por defecto', () => {
    render(<LogoNexa />);
    expect(screen.getByText('Nexa Seguros')).toBeVisible();
  });

  it('la N es decorativa', () => {
    render(<LogoNexa />);
    expect(screen.getByText('N')).toHaveAttribute('aria-hidden', 'true');
  });

  it('sin wordmark se anuncia como imagen', () => {
    render(<LogoNexa showWordmark={false} />);
    expect(screen.getByRole('img', { name: 'Nexa Seguros' })).toBeInTheDocument();
    expect(screen.queryByText('Nexa Seguros')).toBeNull();
  });

  it('sin violaciones de accesibilidad', async () => {
    const { container } = render(
      <>
        <LogoNexa />
        <LogoNexa showWordmark={false} />
      </>,
    );
    expect((await axe(container)).violations).toEqual([]);
  });
});
