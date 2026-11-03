import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { Button, Dialogo } from '../src/index';

const acciones = (
  <>
    <Button label="Cancelar" variant="secondary" />
    <Button label="Confirmar" />
  </>
);

describe('Dialogo', () => {
  it('role alertdialog con nombre y descripción', () => {
    render(
      <Dialogo titulo="¿Dar de baja?" descripcion="La acción no se puede deshacer.">
        {acciones}
      </Dialogo>,
    );
    const dialogo = screen.getByRole('alertdialog', { name: '¿Dar de baja?' });
    const idDescripcion = dialogo.getAttribute('aria-describedby');
    expect(idDescripcion).toBeTruthy();
    expect(document.getElementById(idDescripcion ?? '')).toHaveTextContent(
      'La acción no se puede deshacer.',
    );
  });

  it('sin violaciones de accesibilidad', async () => {
    const { container } = render(
      <Dialogo titulo="¿Dar de baja?" descripcion="La acción no se puede deshacer.">
        {acciones}
      </Dialogo>,
    );
    expect((await axe(container)).violations).toEqual([]);
  });
});
