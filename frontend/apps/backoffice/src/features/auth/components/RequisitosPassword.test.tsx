import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RequisitosPassword } from './RequisitosPassword';

const TEXTOS = ['Al menos 12 caracteres', 'Una mayúscula', 'Una minúscula', 'Un número', 'Un símbolo'];

function estado(texto: string): string {
  const item = screen.getByText(texto, { exact: false }).closest('li');
  return within(item as HTMLElement).getByText(/Cumplido|Pendiente/).textContent ?? '';
}

describe('RequisitosPassword', () => {
  it('marca_cada_requisito_en_vivo', () => {
    const { rerender } = render(<RequisitosPassword id="r" valor="" />);
    TEXTOS.forEach((texto) => expect(estado(texto)).toContain('Pendiente'));

    rerender(<RequisitosPassword id="r" valor="Aa1-" />);
    expect(estado('Una mayúscula')).toContain('Cumplido');
    expect(estado('Una minúscula')).toContain('Cumplido');
    expect(estado('Un número')).toContain('Cumplido');
    expect(estado('Un símbolo')).toContain('Cumplido');
    expect(estado('Al menos 12 caracteres')).toContain('Pendiente');

    rerender(<RequisitosPassword id="r" valor="Aa1-bcdefghijk" />);
    TEXTOS.forEach((texto) => expect(estado(texto)).toContain('Cumplido'));
  });

  it('el_estado_no_depende_solo_del_color', () => {
    render(<RequisitosPassword id="r" valor="" />);
    expect(screen.getAllByText(/Pendiente/)).toHaveLength(5);
  });
});
