import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { Button } from '../src/index';

describe('Button', () => {
  it('variante primary usa action-primary', () => {
    render(<Button label="Guardar" />);
    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveClass(
      'bg-action-primary',
      'text-action-on-primary',
    );
  });

  it('variantes secondary y ghost usan sus tokens', () => {
    render(
      <>
        <Button label="Editar" variant="secondary" />
        <Button label="Dar de baja" variant="ghost" />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Editar' })).toHaveClass(
      'border-border-strong',
      'bg-surface-panel',
      'text-text-primary',
    );
    expect(screen.getByRole('button', { name: 'Dar de baja' })).toHaveClass(
      'bg-transparent',
      'text-text-primary',
    );
  });

  it('tamaño M tiene 40 px y S tiene 32 px', () => {
    render(
      <>
        <Button label="Medio" size="m" />
        <Button label="Chico" size="s" />
      </>,
    );
    const m = screen.getByRole('button', { name: 'Medio' });
    const s = screen.getByRole('button', { name: 'Chico' });
    expect(m).toHaveClass('h-10', 'text-body');
    expect(s).toHaveClass('h-8', 'text-label');
  });

  it('tipo por defecto button', () => {
    render(<Button label="Guardar" />);
    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveAttribute('type', 'button');
  });

  it('type submit explícito', () => {
    render(<Button label="Guardar" type="submit" />);
    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveAttribute('type', 'submit');
  });

  it('ícono decorativo oculto', () => {
    render(<Button label="Guardar" icon={<svg data-testid="icono" />} />);
    expect(screen.getByTestId('icono').closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('disabled bloquea el clic', async () => {
    const onClick = vi.fn();
    render(<Button label="Guardar" disabled onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('onClick se llama al hacer clic', async () => {
    const onClick = vi.fn();
    render(<Button label="Guardar" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('foco visible con focus-visible', () => {
    render(<Button label="Guardar" />);
    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveClass(
      'focus-visible:outline-2',
      'focus-visible:outline-action-primary',
    );
  });

  it('sin violaciones de accesibilidad', async () => {
    const { container } = render(
      <>
        <Button label="Primario" />
        <Button label="Secundario" variant="secondary" />
        <Button label="Fantasma" variant="ghost" />
      </>,
    );
    expect((await axe(container)).violations).toEqual([]);
  });

  it('label es obligatorio en el tipo', () => {
    // @ts-expect-error falta `label`.
    const sinLabel = <Button />;
    expect(sinLabel).toBeDefined();
  });
});
