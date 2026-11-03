import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { BADGE_ESTADOS, EstadoBadge, type BadgeEstado } from '../src/index';

function clasesDe(estado: BadgeEstado): string {
  const { unmount } = render(<EstadoBadge estado={estado} />);
  const clases = screen.getByText(estado).className;
  unmount();
  return clases;
}

describe('EstadoBadge', () => {
  it.each(BADGE_ESTADOS)('muestra el literal del estado %s', (estado) => {
    render(<EstadoBadge estado={estado} />);
    expect(screen.getByText(estado)).toBeVisible();
  });

  it('usa clases de token de fondo y texto en los nueve estados', () => {
    for (const estado of BADGE_ESTADOS) {
      const clases = clasesDe(estado);
      expect(clases).toMatch(/\bbg-status-[a-z]+-bg\b/);
      expect(clases).toMatch(/\btext-status-[a-z]+-text\b/);
    }
  });

  it('Pagada usa los colores de Vigente', () => {
    expect(clasesDe('Pagada')).toBe(clasesDe('Vigente'));
    expect(clasesDe('Pagada')).toContain('bg-status-vigente-bg');
  });

  it('Anulada usa los colores de Vencida', () => {
    expect(clasesDe('Anulada')).toContain('bg-status-vencida-bg');
    expect(clasesDe('Anulada')).toContain('text-status-vencida-text');
  });

  it('Validado usa los colores de Vigente', () => {
    expect(clasesDe('Validado')).toContain('bg-status-vigente-bg');
    expect(clasesDe('Validado')).toContain('text-status-vigente-text');
  });

  it('Pendiente CAE usa los colores de Suspendida', () => {
    expect(clasesDe('Pendiente CAE')).toContain('bg-status-suspendida-bg');
    expect(clasesDe('Pendiente CAE')).toContain('text-status-suspendida-text');
  });

  it('BADGE_ESTADOS tiene nueve valores exactos', () => {
    expect([...BADGE_ESTADOS]).toEqual([
      'Pendiente',
      'Vigente',
      'Suspendida',
      'Cancelada',
      'Vencida',
      'Pagada',
      'Anulada',
      'Validado',
      'Pendiente CAE',
    ]);
  });

  it('no tiene ícono: solo texto', () => {
    const { container } = render(<EstadoBadge estado="Vigente" />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('sin violaciones de accesibilidad', async () => {
    const { container } = render(
      <>
        {BADGE_ESTADOS.map((estado) => (
          <EstadoBadge key={estado} estado={estado} />
        ))}
      </>,
    );
    expect((await axe(container)).violations).toEqual([]);
  });
});
