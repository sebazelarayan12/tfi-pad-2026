import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { PublicFooter } from './PublicFooter';

const contacto = [
  { label: 'Teléfono', value: 'A confirmar' },
  { label: 'Email', value: 'A confirmar' },
  { label: 'Ubicación', value: 'Dirección a confirmar' },
  { label: 'Horarios', value: 'Lunes a viernes, horario a confirmar' },
];
const copyright = '© 2026 Nexa Seguros. Todos los derechos reservados.';

describe('PublicFooter', () => {
  it('muestra las cuatro etiquetas y sus valores', () => {
    const { container } = render(<PublicFooter contacto={contacto} copyright={copyright} />);
    const etiquetas = [...container.querySelectorAll('dt')].map((dt) => dt.textContent);
    const valores = [...container.querySelectorAll('dd')].map((dd) => dd.textContent);
    expect(etiquetas).toEqual(['Teléfono', 'Email', 'Ubicación', 'Horarios']);
    expect(valores).toEqual([
      'A confirmar',
      'A confirmar',
      'Dirección a confirmar',
      'Lunes a viernes, horario a confirmar',
    ]);
  });

  it('muestra el copyright exacto', () => {
    render(<PublicFooter contacto={contacto} copyright={copyright} />);
    expect(screen.getByText(copyright)).toBeInTheDocument();
  });

  it('usa un footer con el id recibido', () => {
    render(<PublicFooter id="contacto" contacto={contacto} copyright={copyright} />);
    expect(screen.getByRole('contentinfo')).toHaveAttribute('id', 'contacto');
  });

  it('sin contacto muestra solo el copyright', () => {
    const { container } = render(<PublicFooter contacto={[]} copyright={copyright} />);
    expect(container.querySelector('dl')).toBeNull();
    expect(screen.getByText(copyright)).toBeInTheDocument();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = render(<PublicFooter contacto={contacto} copyright={copyright} />);
    expect((await axe(container)).violations).toEqual([]);
  });
});
