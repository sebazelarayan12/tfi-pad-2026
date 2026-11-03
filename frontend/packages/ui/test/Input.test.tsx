import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { Input } from '../src/index';

describe('Input', () => {
  it('el label es visible y está asociado al campo', () => {
    render(<Input label="Email" />);
    const campo = screen.getByLabelText('Email');
    expect(campo.tagName).toBe('INPUT');
    expect(screen.getByText('Email')).toBeVisible();
  });

  it('estado default', () => {
    render(<Input label="Email" />);
    const campo = screen.getByLabelText('Email');
    expect(campo).not.toHaveAttribute('aria-invalid');
    expect(campo).toHaveClass('border-border-strong');
    expect(campo.closest('[data-state]')).toHaveAttribute('data-state', 'default');
  });

  it('estado focus usa clases de foco sin cambiar el ancho del borde', () => {
    render(<Input label="Email" />);
    const campo = screen.getByLabelText('Email');
    expect(campo).toHaveClass('focus:border-action-primary', 'focus:ring-1', 'box-border');
    expect(campo.className).not.toMatch(/\bborder-2\b/);
  });

  it('estado error marca aria-invalid y asocia el helper', () => {
    render(<Input label="Email" error helper="Debe ser mayor de 18 años." />);
    const campo = screen.getByLabelText('Email');
    const helper = screen.getByText('Debe ser mayor de 18 años.');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAttribute('aria-describedby', helper.id);
    expect(helper).toHaveClass('text-status-cancelada-text');
    expect(campo.closest('[data-state]')).toHaveAttribute('data-state', 'error');
  });

  it('estado disabled', () => {
    render(<Input label="Email" disabled />);
    const campo = screen.getByLabelText('Email');
    expect(campo).toBeDisabled();
    expect(campo).toHaveClass('bg-surface-subtle');
    expect(campo.closest('[data-state]')).toHaveAttribute('data-state', 'disabled');
    expect(screen.getByText('Email')).toHaveClass('opacity-60');
  });

  it('sin helper no tiene aria-describedby', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-describedby');
  });

  it('un helper sin error se muestra en text-tertiary y se referencia', () => {
    render(<Input label="Email" helper="Usamos tu email para avisarte." />);
    const helper = screen.getByText('Usamos tu email para avisarte.');
    expect(helper).toHaveClass('text-text-tertiary');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-describedby', helper.id);
  });

  it('reenvía ref al input nativo', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input label="Email" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('pasa name y onChange (compatible con register)', async () => {
    const onChange = vi.fn();
    render(<Input label="Email" name="email" onChange={onChange} />);
    const campo = screen.getByLabelText('Email');
    expect(campo).toHaveAttribute('name', 'email');
    await userEvent.type(campo, 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('cada instancia genera un id distinto', () => {
    render(
      <>
        <Input label="Nombre" />
        <Input label="Apellido" />
      </>,
    );
    expect(screen.getByLabelText('Nombre').id).not.toBe(screen.getByLabelText('Apellido').id);
  });

  it('sin violaciones de accesibilidad en estado error', async () => {
    const { container } = render(<Input label="Email" error helper="Email inválido." />);
    expect((await axe(container)).violations).toEqual([]);
  });

  it('label es obligatorio en el tipo', () => {
    // @ts-expect-error falta `label`.
    const sinLabel = <Input />;
    expect(sinLabel).toBeDefined();
  });
});
