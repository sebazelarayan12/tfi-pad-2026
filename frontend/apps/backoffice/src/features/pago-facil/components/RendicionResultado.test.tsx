import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { RendicionResultado } from './RendicionResultado';

const resultado = {
  id: 'rendicion-1',
  nombreArchivo: 'rendicion.txt',
  cantidadRegistros: 2,
  importeTotal: 400,
  procesadas: 1,
  rechazadas: 1,
  errores: [{ linea: 2, motivo: 'Código inválido.' }],
};

it('copia el resumen y los rechazos al portapapeles', async () => {
  const usuario = userEvent.setup();
  const escribir = vi.spyOn(navigator.clipboard, 'writeText');
  render(<RendicionResultado resultado={resultado} />);
  await usuario.click(screen.getByRole('button', { name: 'Copiar resultado' }));
  expect(escribir).toHaveBeenCalledWith(expect.stringContaining('Línea 2: Código inválido.'));
  expect(await screen.findByText('Resultado copiado.')).toBeInTheDocument();
});

it('informa el fallo si el portapapeles no está disponible', async () => {
  const usuario = userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('Permiso denegado'));
  render(<RendicionResultado resultado={resultado} />);
  await usuario.click(screen.getByRole('button', { name: 'Copiar resultado' }));
  expect(
    await screen.findByText('No se pudo copiar. Seleccioná el texto y copialo a mano.'),
  ).toBeInTheDocument();
});

it('no encuentra violaciones de accesibilidad en un resultado parcial', async () => {
  const { container } = render(<RendicionResultado resultado={resultado} />);
  expect((await axe(container)).violations).toEqual([]);
});
