import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectSinViolacionesA11y } from '../../testing/a11y';
import { Toaster, toast } from './Toaster';

describe('Toaster', () => {
  it('muestra_un_aviso_de_exito', async () => {
    render(<Toaster />);
    act(() => {
      toast.success('Usuario creado.');
    });
    expect(await screen.findByText('Usuario creado.')).toBeInTheDocument();
  });

  it('muestra_un_aviso_de_error', async () => {
    render(<Toaster />);
    act(() => {
      toast.error('No se pudo copiar.');
    });
    expect(await screen.findByText('No se pudo copiar.')).toBeInTheDocument();
  });

  it('la_region_tiene_nombre_en_espanol', () => {
    render(<Toaster />);
    expect(screen.getByLabelText('Notificaciones', { exact: false })).toBeInTheDocument();
  });

  it('a11y_sin_violaciones', async () => {
    const { container } = render(<Toaster />);
    act(() => {
      toast.success('Listo.');
    });
    await screen.findByText('Listo.');
    await expectSinViolacionesA11y(container);
  });
});
