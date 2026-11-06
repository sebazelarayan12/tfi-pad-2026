import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { renderConProveedores } from '../test/utils';
import { pagoListado, pagina, respuestaPagos, servirPagos } from '../test/fixturesListado';
import { PagosPage } from './PagosPage';

function diezPagos(desde = 1) {
  return Array.from({ length: 10 }, (_, i) => pagoListado(desde + i));
}

describe('PagosPage: tabla', () => {
  it('muestra los headers del Figma en orden', async () => {
    servirPagos(() => respuestaPagos([pagoListado(1)], 1, 1));
    renderConProveedores(<PagosPage />);

    const tabla = await screen.findByRole('table', { name: 'Pagos' });
    const encabezados = within(tabla).getAllByRole('columnheader');
    expect(encabezados.map((th) => th.textContent)).toEqual([
      'Fecha',
      'Cliente',
      'Póliza',
      'Cuotas',
      'Medio',
      'Importe',
      'Estado',
      'Factura',
    ]);
    for (const th of encabezados) expect(th).toHaveAttribute('scope', 'col');
  });

  it('muestra los datos de la fila con formatos de T-09 y T-10', async () => {
    servirPagos(() =>
      respuestaPagos([pagoListado(1, { cuotas: [8, 9], medio: 'PAGO_FACIL', estado: 'PENDIENTE' })], 1, 1),
    );
    renderConProveedores(<PagosPage />);

    const fila = (await screen.findByText('Lucía Benítez')).closest('tr')!;
    expect(fila).toHaveTextContent('27/10/2026');
    expect(fila).toHaveTextContent('POL-0000057');
    expect(fila).toHaveTextContent('8 y 9');
    expect(fila).toHaveTextContent('Pago Fácil');
    expect(fila).toHaveTextContent('$ 26.250,00');
    expect(within(fila).getByText('Pendiente')).toBeInTheDocument();
    expect(fila).toHaveTextContent('A-0003-00000187');
  });

  it('muestra el esqueleto de 10 filas mientras carga', async () => {
    servirPagos(() => respuestaPagos(diezPagos(), 1, 74));
    renderConProveedores(<PagosPage />);

    expect(screen.getByTestId('esqueleto-pagos').children).toHaveLength(10);
    await screen.findAllByText('Lucía Benítez');
    expect(screen.queryByTestId('esqueleto-pagos')).not.toBeInTheDocument();
  });

  it('una tabla vacía muestra el mensaje', async () => {
    servirPagos(() => respuestaPagos([], 1, 0));
    renderConProveedores(<PagosPage />);

    expect(await screen.findByText('No hay pagos para mostrar.')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 0 a 0 de 0 pagos')).toBeInTheDocument();
  });

  it('un error muestra el detail del back', async () => {
    servirPagos(() =>
      HttpResponse.json(
        { status: 500, detail: 'Falló el servidor.' },
        { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    );
    renderConProveedores(<PagosPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar los pagos. Falló el servidor.',
    );
  });

  it('no muestra la pestaña Facturas ni el filtro Período', async () => {
    servirPagos(() => respuestaPagos([pagoListado(1)], 1, 1));
    renderConProveedores(<PagosPage />);
    await screen.findByText('Lucía Benítez');

    expect(screen.queryByText('Facturas')).not.toBeInTheDocument();
    expect(screen.queryByText('Período')).not.toBeInTheDocument();
    expect(screen.queryByText('Reintentar')).not.toBeInTheDocument();
  });
});

describe('PagosPage: filtros', () => {
  it('Todos es el valor inicial y no envía medio ni estado', async () => {
    const recibidos = servirPagos(() => respuestaPagos(diezPagos(), 1, 74));
    renderConProveedores(<PagosPage />);
    await screen.findAllByText('Lucía Benítez');

    expect(screen.getByLabelText('Medio')).toHaveValue('Todos');
    expect(screen.getByLabelText('Estado')).toHaveValue('Todos');
    expect(recibidos[0]?.has('medio')).toBe(false);
    expect(recibidos[0]?.has('estado')).toBe(false);
    expect(recibidos[0]?.get('pagina')).toBe('1');
    expect(recibidos[0]?.get('tamano')).toBe('10');
  });

  it('elegir Caja y Aprobado envía medio=CAJA y estado=APROBADO', async () => {
    const usuario = userEvent.setup();
    const recibidos = servirPagos(() => respuestaPagos(diezPagos(), 1, 74));
    renderConProveedores(<PagosPage />);
    await screen.findAllByText('Lucía Benítez');

    await usuario.selectOptions(screen.getByLabelText('Medio'), 'Caja');
    await usuario.selectOptions(screen.getByLabelText('Estado'), 'Aprobado');

    await waitFor(() => {
      expect(recibidos.at(-1)?.get('medio')).toBe('CAJA');
      expect(recibidos.at(-1)?.get('estado')).toBe('APROBADO');
    });
  });

  it('nunca envía un rango de fechas', async () => {
    const recibidos = servirPagos(() => respuestaPagos(diezPagos(), 1, 74));
    renderConProveedores(<PagosPage />);
    await screen.findAllByText('Lucía Benítez');

    for (const params of recibidos) {
      expect(params.has('desde')).toBe(false);
      expect(params.has('hasta')).toBe(false);
    }
  });

  it('cambiar un filtro vuelve a la página 1', async () => {
    const usuario = userEvent.setup();
    const recibidos = servirPagos((params) => {
      const numero = Number(params.get('pagina'));
      return HttpResponse.json(pagina(diezPagos((numero - 1) * 10 + 1), numero, 74));
    });
    renderConProveedores(<PagosPage />);
    await screen.findByText('Mostrando 1 a 10 de 74 pagos');
    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByText('Mostrando 11 a 20 de 74 pagos');

    await usuario.selectOptions(screen.getByLabelText('Estado'), 'Rechazado');

    await waitFor(() => expect(recibidos.at(-1)?.get('estado')).toBe('RECHAZADO'));
    expect(recibidos.at(-1)?.get('pagina')).toBe('1');
  });
});

describe('PagosPage: paginación', () => {
  it('muestra el conteo y deja Anterior deshabilitado en la primera página', async () => {
    servirPagos(() => respuestaPagos(diezPagos(), 1, 74));
    renderConProveedores(<PagosPage />);

    expect(await screen.findByText('Mostrando 1 a 10 de 74 pagos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
  });

  it('Siguiente avanza de página y los filtros se conservan', async () => {
    const usuario = userEvent.setup();
    const recibidos = servirPagos((params) => {
      const numero = Number(params.get('pagina'));
      return HttpResponse.json(pagina(diezPagos((numero - 1) * 10 + 1), numero, 74));
    });
    renderConProveedores(<PagosPage />);
    await screen.findByText('Mostrando 1 a 10 de 74 pagos');
    await usuario.selectOptions(screen.getByLabelText('Medio'), 'Caja');
    await screen.findByText('Mostrando 1 a 10 de 74 pagos');

    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Mostrando 11 a 20 de 74 pagos')).toBeInTheDocument();
    expect(recibidos.at(-1)?.get('pagina')).toBe('2');
    expect(recibidos.at(-1)?.get('medio')).toBe('CAJA');
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled();
  });

  it('Siguiente queda deshabilitado en la última página', async () => {
    const usuario = userEvent.setup();
    servirPagos((params) => {
      const numero = Number(params.get('pagina'));
      return HttpResponse.json(
        pagina(numero === 8 ? [pagoListado(71)] : diezPagos((numero - 1) * 10 + 1), numero, 71),
      );
    });
    renderConProveedores(<PagosPage />);
    await screen.findByText('Mostrando 1 a 10 de 71 pagos');
    for (let i = 1; i < 8; i++) {
      await usuario.click(await screen.findByRole('button', { name: 'Siguiente' }));
      await screen.findByText(`Mostrando ${i * 10 + 1} a ${Math.min(i * 10 + 10, 71)} de 71 pagos`);
    }

    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });
});

describe('PagosPage: accesibilidad', () => {
  it('no tiene violaciones con datos', async () => {
    servirPagos(() => respuestaPagos(diezPagos(), 1, 74));
    const { container } = renderConProveedores(<PagosPage />);
    await screen.findAllByText('Lucía Benítez');

    await expectSinViolacionesA11y(container);
  });
});
