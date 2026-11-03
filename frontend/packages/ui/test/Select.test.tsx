import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { Select } from '../src/index';

type Uso = 'Particular' | 'Comercial';

const OPCIONES: { value: Uso; label: string }[] = [
  { value: 'Particular', label: 'Particular' },
  { value: 'Comercial', label: 'Comercial' },
];

describe('Select', () => {
  it('muestra el placeholder Seleccioná una opción sin valor', () => {
    render(<Select label="Uso" options={OPCIONES} />);
    const campo = screen.getByRole('combobox', { name: 'Uso' });
    expect(campo).toHaveValue('');
    const placeholder = screen.getByText('Seleccioná una opción');
    expect(placeholder.tagName).toBe('OPTION');
    expect(placeholder).toHaveValue('');
  });

  it('llama onChange con el valor de la opción', async () => {
    const onChange = vi.fn();
    render(<Select<Uso> label="Uso" options={OPCIONES} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Uso' }), 'Comercial');
    expect(onChange).toHaveBeenCalledWith('Comercial');
  });

  it('estado error', () => {
    render(<Select label="Uso" options={OPCIONES} error helper="Elegí un uso." />);
    const campo = screen.getByRole('combobox', { name: 'Uso' });
    const helper = screen.getByText('Elegí un uso.');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAttribute('aria-describedby', helper.id);
    expect(campo.closest('[data-state]')).toHaveAttribute('data-state', 'error');
  });

  it('estado disabled', () => {
    render(<Select label="Uso" options={OPCIONES} disabled />);
    const campo = screen.getByRole('combobox', { name: 'Uso' });
    expect(campo).toBeDisabled();
    expect(campo.closest('[data-state]')).toHaveAttribute('data-state', 'disabled');
  });

  it('caret decorativo', () => {
    const { container } = render(<Select label="Uso" options={OPCIONES} />);
    const caret = container.querySelector('svg');
    expect(caret).not.toBeNull();
    expect(caret?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('reenvía ref al select nativo', () => {
    const ref = createRef<HTMLSelectElement>();
    render(<Select label="Uso" options={OPCIONES} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });

  it('tiene las medidas del campo', () => {
    render(<Select label="Uso" options={OPCIONES} />);
    expect(screen.getByRole('combobox', { name: 'Uso' })).toHaveClass(
      'h-10',
      'rounded-input',
      'px-sp-12',
      'box-border',
      'appearance-none',
    );
  });

  it('sin violaciones de accesibilidad', async () => {
    const { container } = render(<Select label="Uso" options={OPCIONES} />);
    expect((await axe(container)).violations).toEqual([]);
  });

  it('label es obligatorio en el tipo', () => {
    // @ts-expect-error falta `label`.
    const sinLabel = <Select options={OPCIONES} />;
    expect(sinLabel).toBeDefined();
  });
});
