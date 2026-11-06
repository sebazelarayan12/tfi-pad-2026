import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, expect, it, vi } from 'vitest';
import { proveedoresRendicion } from '../test/proveedoresRendicion';
import { BasePositivaCard } from './BasePositivaCard';

const endpoint = '*/api/pagofacil/base-positiva';
const contenido = 'H1234520261120'.padEnd(97) + '\r\n';
const inesperado = 'La base positiva llegó con un formato inesperado. No se descargó.';

function montar() {
  const { wrapper } = proveedoresRendicion();
  return render(<BasePositivaCard />, { wrapper });
}

function boton() {
  return screen.getByRole('button', { name: 'Generar base positiva' });
}

function interceptarDescarga() {
  const crear = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:https://api.test/base');
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  return { crear, click };
}

afterEach(() => vi.restoreAllMocks());

it('no muestra el historial de bases ni acciones por fila', () => {
  montar();
  expect(boton()).toBeInTheDocument();
  expect(screen.queryByText('Últimas bases generadas')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Descargar' })).not.toBeInTheDocument();
});

it('envía el token y descarga con el nombre derivado del registro H', async () => {
  const token = vi.fn();
  servidorMock.use(
    http.get(endpoint, ({ request }) => {
      token(request.headers.get('Authorization'));
      return HttpResponse.text(contenido, {
        headers: { 'Content-Disposition': 'attachment; filename="ignorado.txt"' },
      });
    }),
  );
  const { crear, click } = interceptarDescarga();
  montar();
  await userEvent.click(boton());
  await waitFor(() => expect(click).toHaveBeenCalledOnce());
  expect(token).toHaveBeenCalledWith('Bearer mock-empleado');
  expect(click.mock.contexts[0]).toHaveProperty('download', 'BASEPOS_12345_20261120.txt');
  expect(crear).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'text/plain', size: contenido.length }),
  );
});

it.each([
  ['registro distinto de H', 'D1234520261120'],
  ['fecha con menos de ocho dígitos', 'H123452026112 '],
  ['texto corto', 'H12345'],
  ['empresa no numérica', 'Habcde20261120'],
])('rechaza %s sin crear una descarga', async (_caso, texto) => {
  servidorMock.use(http.get(endpoint, () => HttpResponse.text(texto)));
  const { crear } = interceptarDescarga();
  montar();
  await userEvent.click(boton());
  expect(await screen.findByRole('alert')).toHaveTextContent(inesperado);
  expect(crear).not.toHaveBeenCalled();
});

it('rechaza un 200 con application/problem+json', async () => {
  servidorMock.use(
    http.get(endpoint, () =>
      HttpResponse.text(contenido, { headers: { 'Content-Type': 'application/problem+json' } }),
    ),
  );
  const { crear } = interceptarDescarga();
  montar();
  await userEvent.click(boton());
  expect(await screen.findByRole('alert')).toHaveTextContent(inesperado);
  expect(crear).not.toHaveBeenCalled();
});

it('muestra el detalle del 400 de desborde y no descarga', async () => {
  const detail = 'El importe 99999999.99 no entra en el código de Pago Fácil.';
  servidorMock.use(
    http.get(endpoint, () =>
      HttpResponse.json(
        { detail },
        { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    ),
  );
  const { crear } = interceptarDescarga();
  montar();
  await userEvent.click(boton());
  expect(await screen.findByRole('alert')).toHaveTextContent(detail);
  expect(crear).not.toHaveBeenCalled();
});

function demorarDescarga() {
  let terminar = () => {};
  const pendiente = new Promise<void>((resolve) => {
    terminar = resolve;
  });
  const pedir = vi.fn(async () => {
    await pendiente;
    return HttpResponse.text(contenido);
  });
  servidorMock.use(http.get(endpoint, pedir));
  return { pedir, terminar, click: interceptarDescarga().click };
}

it('genera un solo GET incluso con dos clics seguidos', async () => {
  const { pedir, terminar, click } = demorarDescarga();
  montar();
  const control = boton();
  try {
    fireEvent.click(control);
    fireEvent.click(control);
    await waitFor(() => expect(pedir).toHaveBeenCalledOnce());
  } finally {
    terminar();
  }
  await waitFor(() => expect(click).toHaveBeenCalledOnce());
  expect(pedir).toHaveBeenCalledOnce();
});

it('deshabilita el botón durante la generación', async () => {
  const { terminar, click } = demorarDescarga();
  montar();
  try {
    await userEvent.click(boton());
    expect(await screen.findByRole('button', { name: 'Generando base positiva…' })).toBeDisabled();
  } finally {
    terminar();
  }
  await waitFor(() => expect(click).toHaveBeenCalledOnce());
  expect(await screen.findByRole('button', { name: 'Generar base positiva' })).toBeEnabled();
});

it('no tiene violaciones de accesibilidad', async () => {
  const { container } = montar();
  await expectSinViolacionesA11y(container);
});

it('avisa el fallo de red y no reintenta ni descarga', async () => {
  const pedir = vi.fn(() => HttpResponse.error());
  servidorMock.use(http.get(endpoint, pedir));
  const { crear } = interceptarDescarga();
  montar();
  await userEvent.click(boton());
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar.');
  expect(pedir).toHaveBeenCalledOnce();
  expect(crear).not.toHaveBeenCalled();
});
