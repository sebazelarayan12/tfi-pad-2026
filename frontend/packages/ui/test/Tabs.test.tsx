import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { TabPanel, Tabs, type TabItem } from '../src/index';

const ITEMS: TabItem[] = [
  { id: 'pagos', label: 'Pagos' },
  { id: 'facturas', label: 'Facturas' },
  { id: 'notas', label: 'Notas' },
];

function Controlado({ inicial = 'pagos' }: { inicial?: string }) {
  const [value, setValue] = useState(inicial);
  return (
    <Tabs label="Secciones" items={ITEMS} value={value} onValueChange={setValue}>
      {ITEMS.map((item) => (
        <TabPanel key={item.id} tabId={item.id}>
          Contenido {item.label}
        </TabPanel>
      ))}
    </Tabs>
  );
}

describe('Tabs', () => {
  it('roles tablist, tab y tabpanel', () => {
    render(<Controlado />);
    expect(screen.getByRole('tablist', { name: 'Secciones' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(3);
  });

  it('aria-selected y tabIndex de la pestaña activa', () => {
    render(<Controlado inicial="facturas" />);
    const [pagos, facturas, notas] = screen.getAllByRole('tab');
    expect(facturas).toHaveAttribute('aria-selected', 'true');
    expect(facturas).toHaveAttribute('tabindex', '0');
    for (const tab of [pagos, notas]) {
      expect(tab).toHaveAttribute('aria-selected', 'false');
      expect(tab).toHaveAttribute('tabindex', '-1');
    }
  });

  it('aria-controls y aria-labelledby se corresponden', () => {
    render(<Controlado />);
    const paneles = screen.getAllByRole('tabpanel', { hidden: true });
    screen.getAllByRole('tab').forEach((tab, indice) => {
      const panel = paneles[indice] as HTMLElement;
      expect(tab.getAttribute('aria-controls')).toBe(panel.id);
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
    });
  });

  it('ArrowRight mueve la selección y llama onValueChange', async () => {
    const onValueChange = vi.fn();
    render(<Tabs label="Secciones" items={ITEMS} value="pagos" onValueChange={onValueChange} />);
    screen.getAllByRole('tab')[0]?.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenCalledWith('facturas');
    expect(screen.getAllByRole('tab')[1]).toHaveFocus();
  });

  it('ArrowRight en la última vuelve a la primera', async () => {
    render(<Controlado inicial="notas" />);
    screen.getByRole('tab', { name: 'Notas' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Pagos' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Pagos' })).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowLeft vuelve con envoltura', async () => {
    render(<Controlado />);
    screen.getByRole('tab', { name: 'Pagos' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Notas' })).toHaveFocus();
  });

  it('Home y End', async () => {
    render(<Controlado inicial="facturas" />);
    screen.getByRole('tab', { name: 'Facturas' }).focus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Notas' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Pagos' })).toHaveFocus();
  });

  it('es controlado: el clic llama onValueChange y no cambia solo', async () => {
    const onValueChange = vi.fn();
    render(<Tabs label="Secciones" items={ITEMS} value="pagos" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Notas' }));
    expect(onValueChange).toHaveBeenCalledWith('notas');
    expect(screen.getByRole('tab', { name: 'Pagos' })).toHaveAttribute('aria-selected', 'true');
  });

  it('medidas: tablist de 30 px y gap de 24 px', () => {
    render(<Controlado />);
    expect(screen.getByRole('tablist')).toHaveClass('h-[30px]', 'gap-sp-24');
  });

  it('value inválido deja la primera con tabIndex 0', () => {
    render(<Controlado inicial="no-existe" />);
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab).toHaveAttribute('aria-selected', 'false');
    }
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('tabindex', '0');
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute('tabindex', '-1');
  });

  it('con un solo ítem las flechas no mueven la selección', async () => {
    const onValueChange = vi.fn();
    render(
      <Tabs
        label="Secciones"
        items={[{ id: 'solo', label: 'Solo' }]}
        value="solo"
        onValueChange={onValueChange}
      />,
    );
    screen.getByRole('tab', { name: 'Solo' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Solo' })).toHaveFocus();
  });

  it('sin violaciones de accesibilidad', async () => {
    const { container } = render(<Controlado />);
    expect((await axe(container)).violations).toEqual([]);
  });
});

describe('TabPanel', () => {
  it('solo el panel activo es visible', () => {
    render(<Controlado inicial="facturas" />);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Contenido Facturas');
    const paneles = screen.getAllByRole('tabpanel', { hidden: true });
    expect(paneles[0]).toHaveAttribute('hidden');
    expect(paneles[1]).not.toHaveAttribute('hidden');
    expect(paneles[2]).toHaveAttribute('hidden');
  });

  it('el panel oculto sigue montado', () => {
    render(<Controlado />);
    expect(screen.getByText('Contenido Notas')).toBeInTheDocument();
  });
});
