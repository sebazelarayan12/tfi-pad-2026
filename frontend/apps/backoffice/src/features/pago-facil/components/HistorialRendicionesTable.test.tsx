import { pagoFacilKeys } from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { act, render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { expect, it, vi } from 'vitest';
import { proveedoresRendicion } from '../test/proveedoresRendicion';
import { HistorialRendicionesTable } from './HistorialRendicionesTable';

const endpoint = '*/api/pagofacil/rendiciones';
const fila = {
  id: '1',
  nombreArchivo: 'rendicion.txt',
  fechaRendicion: '2026-10-27',
  fechaProceso: '2026-10-27T21:05:00Z',
  cantidadRegistros: 192,
  pagosAprobados: 188,
  importeTotal: 4318750,
};

function montar() {
  const { wrapper, queryClient } = proveedoresRendicion();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  render(<HistorialRendicionesTable />, { wrapper });
  return queryClient;
}

function listar() {
  servidorMock.use(http.get(endpoint, () => HttpResponse.json([fila])));
  montar();
  return screen.findByRole('table', { name: 'Archivos procesados' });
}

it('muestra los encabezados en orden', async () => {
  const tabla = await listar();
  expect(
    within(tabla)
      .getAllByRole('columnheader')
      .map((h) => h.textContent),
  ).toEqual([
    'Archivo',
    'Fecha de proceso',
    'Líneas',
    'Pagos generados',
    'Importe total',
    'Estado',
  ]);
});

it('convierte la fecha UTC a hora argentina', async () => {
  expect(within(await listar()).getByText('27/10/2026 18:05')).toBeInTheDocument();
});

it('formatea el importe en es-AR', async () => {
  expect(within(await listar()).getByText(/\$\s4\.318\.750,00/)).toBeInTheDocument();
});

it('muestra Procesado también si quedaron líneas sin pago', async () => {
  const tabla = within(await listar());
  for (const texto of ['192', '188', 'Procesado'])
    expect(tabla.getByText(texto)).toBeInTheDocument();
});

it('muestra el estado vacío', async () => {
  servidorMock.use(http.get(endpoint, () => HttpResponse.json([])));
  montar();
  expect(await screen.findByText('No hay rendiciones procesadas.')).toBeInTheDocument();
});

it('muestra el detalle del error en una alerta', async () => {
  servidorMock.use(
    http.get(endpoint, () =>
      HttpResponse.json({ detail: 'Detalle del historial.' }, { status: 500 }),
    ),
  );
  montar();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'No se pudo cargar el historial. Detalle del historial.',
  );
});

it('refresca la tabla al invalidar la clave que usa la subida', async () => {
  const pedidos = vi
    .fn()
    .mockImplementationOnce(() => HttpResponse.json([]))
    .mockImplementation(() => HttpResponse.json([fila]));
  servidorMock.use(http.get(endpoint, () => pedidos()));
  const cliente = montar();
  await screen.findByText('No hay rendiciones procesadas.');
  await act(async () => cliente.invalidateQueries({ queryKey: pagoFacilKeys.rendiciones() }));
  expect(await screen.findByText(fila.nombreArchivo)).toBeInTheDocument();
  expect(pedidos).toHaveBeenCalledTimes(2);
});
