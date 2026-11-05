import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Topbar } from './Topbar';

describe('Topbar', () => {
  it('muestra el título como h2', () => {
    render(<Topbar titulo="Clientes" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Clientes' })).toBeInTheDocument();
  });

  it('sin título no renderiza el h2', () => {
    render(<Topbar />);
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('el buscador tiene etiqueta y placeholder por defecto', () => {
    render(<Topbar />);
    const buscador = screen.getByLabelText('Buscar cliente o póliza');
    expect(buscador).toHaveAttribute('placeholder', 'Buscar cliente o póliza');
  });

  it('acepta un placeholder propio', () => {
    render(<Topbar buscadorPlaceholder="Buscar plan" />);
    expect(screen.getByLabelText('Buscar plan')).toBeInTheDocument();
  });

  it('llama onBuscar con el texto al enviar', async () => {
    const onBuscar = vi.fn();
    render(<Topbar onBuscar={onBuscar} />);
    await userEvent.type(screen.getByLabelText('Buscar cliente o póliza'), 'Pérez{Enter}');
    expect(onBuscar).toHaveBeenCalledWith('Pérez');
  });

  it('sin onBuscar enviar el buscador no falla', async () => {
    render(<Topbar />);
    await userEvent.type(screen.getByLabelText('Buscar cliente o póliza'), 'x{Enter}');
    expect(screen.getByLabelText('Buscar cliente o póliza')).toBeInTheDocument();
  });

  it('la campana se llama Notificaciones y dispara onNotificaciones', async () => {
    const onNotificaciones = vi.fn();
    render(<Topbar onNotificaciones={onNotificaciones} />);
    await userEvent.click(screen.getByRole('button', { name: 'Notificaciones' }));
    expect(onNotificaciones).toHaveBeenCalledTimes(1);
  });

  it('la campana sin acción es enfocable y no falla', async () => {
    render(<Topbar />);
    const campana = screen.getByRole('button', { name: 'Notificaciones' });
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.click(campana);
    expect(campana).toBeInTheDocument();
  });

  it('renderiza la acción de la página', () => {
    render(<Topbar accion={<button type="button">Nuevo cliente</button>} />);
    expect(screen.getByRole('button', { name: 'Nuevo cliente' })).toBeInTheDocument();
  });
});
