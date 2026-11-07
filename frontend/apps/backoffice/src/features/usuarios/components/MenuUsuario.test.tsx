import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MenuUsuario } from './MenuUsuario';

function montar(props: Partial<Parameters<typeof MenuUsuario>[0]> = {}) {
  const acciones = { onEditar: vi.fn(), onDesactivar: vi.fn(), onActivar: vi.fn() };
  const usuario = userEvent.setup();
  render(<MenuUsuario nombre="Hernán Sosa" activo motivoBloqueo={null} {...acciones} {...props} />);
  return { usuario, ...acciones };
}

const boton = () => screen.getByRole('button', { name: 'Acciones de Hernán Sosa' });

describe('MenuUsuario', () => {
  it('un usuario activo ofrece Editar y Desactivar', async () => {
    const { usuario } = montar();
    await usuario.click(boton());
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Desactivar' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Activar' })).toBeNull();
  });

  it('un usuario inactivo ofrece Editar y Activar', async () => {
    const { usuario } = montar({ activo: false });
    await usuario.click(boton());
    expect(screen.getByRole('menuitem', { name: 'Activar' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Desactivar' })).toBeNull();
  });

  it('Escape cierra el menú y devuelve el foco al botón', async () => {
    const { usuario } = montar();
    await usuario.click(boton());
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await usuario.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(boton()).toHaveFocus();
  });

  it('las flechas mueven el foco entre los ítems', async () => {
    const { usuario } = montar();
    await usuario.click(boton());
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus();
    await usuario.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Desactivar' })).toHaveFocus();
    await usuario.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus();
  });

  it('elegir Editar y Desactivar llama a su acción y cierra el menú', async () => {
    const { usuario, onEditar, onDesactivar } = montar();
    await usuario.click(boton());
    await usuario.click(screen.getByRole('menuitem', { name: 'Editar' }));
    expect(onEditar).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();

    await usuario.click(boton());
    await usuario.click(screen.getByRole('menuitem', { name: 'Desactivar' }));
    expect(onDesactivar).toHaveBeenCalledTimes(1);
  });

  it('con motivo de bloqueo Desactivar no actúa y el motivo se lee junto al ítem', async () => {
    const { usuario, onDesactivar } = montar({
      motivoBloqueo: 'No podés desactivar tu propia cuenta.',
    });
    await usuario.click(boton());
    const desactivar = screen.getByRole('menuitem', { name: 'Desactivar' });
    expect(desactivar).toHaveAttribute('aria-disabled', 'true');
    expect(desactivar).toHaveAccessibleDescription('No podés desactivar tu propia cuenta.');
    await usuario.click(desactivar);
    expect(onDesactivar).not.toHaveBeenCalled();
  });
});
