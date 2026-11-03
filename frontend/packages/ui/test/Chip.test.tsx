import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { Chip } from '../src/index';

describe('Chip', () => {
  it('destacado y neutro son span no interactivos', () => {
    render(
      <>
        <Chip tipo="destacado" label="12 clientes" />
        <Chip tipo="neutro" label="Activos" />
      </>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('12 clientes').tagName).toBe('SPAN');
    expect(screen.getByText('12 clientes')).toHaveClass('bg-accent-lime');
    expect(screen.getByText('Activos').tagName).toBe('SPAN');
    expect(screen.getByText('Activos')).toHaveClass('bg-surface-subtle');
  });

  it('seleccionado es button con aria-pressed true', () => {
    render(<Chip tipo="seleccionado" label="Vigente" />);
    const chip = screen.getByRole('button', { name: 'Vigente' });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(chip).toHaveAttribute('type', 'button');
    expect(chip).toHaveClass('bg-action-primary');
  });

  it('sin-seleccionar es button con aria-pressed false', () => {
    render(<Chip tipo="sin-seleccionar" label="Vencida" />);
    const chip = screen.getByRole('button', { name: 'Vencida' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(chip).toHaveClass('border-border-strong');
  });

  it('onClick se llama al hacer clic en seleccionado', async () => {
    const onClick = vi.fn();
    render(<Chip tipo="seleccionado" label="Vigente" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Vigente' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('un chip seleccionable sin onClick sigue siendo button', () => {
    render(<Chip tipo="sin-seleccionar" label="Vencida" />);
    expect(screen.getByRole('button', { name: 'Vencida' })).toBeInTheDocument();
  });

  it('onClick en un chip no interactivo se ignora', async () => {
    const onClick = vi.fn();
    render(<Chip tipo="destacado" label="12 clientes" onClick={onClick} />);
    await userEvent.click(screen.getByText('12 clientes'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('los chips seleccionables tienen foco visible', () => {
    render(<Chip tipo="seleccionado" label="Vigente" />);
    expect(screen.getByRole('button', { name: 'Vigente' })).toHaveClass(
      'focus-visible:outline-2',
      'focus-visible:outline-action-primary',
    );
  });

  it('sin violaciones de accesibilidad', async () => {
    const { container } = render(
      <>
        <Chip tipo="destacado" label="12 clientes" />
        <Chip tipo="neutro" label="Activos" />
        <Chip tipo="seleccionado" label="Vigente" />
        <Chip tipo="sin-seleccionar" label="Vencida" />
      </>,
    );
    expect((await axe(container)).violations).toEqual([]);
  });

  it('tipo es obligatorio en el tipo', () => {
    // @ts-expect-error falta `tipo`.
    const sinTipo = <Chip label="Vigente" />;
    expect(sinTipo).toBeDefined();
  });
});
