import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { Table, type TableColumn } from '../src/index';

interface Fila {
  id: string;
  nombre: string;
  dni: string;
}

const FILAS: Fila[] = [
  { id: 'a', nombre: 'Ana Pérez', dni: '30111222' },
  { id: 'b', nombre: 'Luis Gómez', dni: '28999888' },
];

const COLUMNAS: TableColumn<Fila>[] = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'dni', header: 'DNI', mono: true },
];

const getRowKey = (fila: Fila) => fila.id;

describe('Table', () => {
  it('tiene caption accesible', () => {
    render(<Table caption="Clientes" columns={COLUMNAS} rows={FILAS} getRowKey={getRowKey} />);
    expect(screen.getByRole('table', { name: 'Clientes' })).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toHaveClass('sr-only');
  });

  it('encabezados con scope col', () => {
    render(<Table caption="Clientes" columns={COLUMNAS} rows={FILAS} getRowKey={getRowKey} />);
    const encabezados = screen.getAllByRole('columnheader');
    expect(encabezados).toHaveLength(2);
    for (const th of encabezados) expect(th).toHaveAttribute('scope', 'col');
  });

  it('caption obligatorio en el tipo', () => {
    // @ts-expect-error falta `caption`.
    const sinCaption = <Table columns={COLUMNAS} rows={FILAS} getRowKey={getRowKey} />;
    expect(sinCaption).toBeDefined();
  });

  it('una fila por elemento de rows', () => {
    render(<Table caption="Clientes" columns={COLUMNAS} rows={FILAS} getRowKey={getRowKey} />);
    const cuerpo = screen.getAllByRole('rowgroup')[1];
    expect(cuerpo).toBeDefined();
    expect(within(cuerpo as HTMLElement).getAllByRole('row')).toHaveLength(FILAS.length);
  });

  it('usa getRowKey: claves únicas no generan advertencias', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<Table caption="Clientes" columns={COLUMNAS} rows={FILAS} getRowKey={getRowKey} />);
    expect(error).not.toHaveBeenCalled();
  });

  it('usa getRowKey: una clave repetida genera advertencia', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<Table caption="Clientes" columns={COLUMNAS} rows={FILAS} getRowKey={() => 'igual'} />);
    expect(error).toHaveBeenCalled();
  });

  it('render sobrescribe el valor de la celda', () => {
    const columnas: TableColumn<Fila>[] = [
      { key: 'nombre', header: 'Nombre', render: (fila) => `Sr/a ${fila.nombre}` },
    ];
    render(<Table caption="Clientes" columns={columnas} rows={FILAS} getRowKey={getRowKey} />);
    expect(screen.getByRole('cell', { name: 'Sr/a Ana Pérez' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Ana Pérez' })).toBeNull();
  });

  it('columna mono usa font-mono', () => {
    render(<Table caption="Clientes" columns={COLUMNAS} rows={FILAS} getRowKey={getRowKey} />);
    expect(screen.getByRole('cell', { name: '30111222' })).toHaveClass('font-mono');
    expect(screen.getByRole('cell', { name: 'Ana Pérez' })).not.toHaveClass('font-mono');
  });

  it('width fija la columna con style', () => {
    const columnas: TableColumn<Fila>[] = [
      { key: 'nombre', header: 'Nombre', width: 120 },
      { key: 'dni', header: 'DNI' },
    ];
    render(<Table caption="Clientes" columns={columnas} rows={FILAS} getRowKey={getRowKey} />);
    expect(screen.getByRole('columnheader', { name: 'Nombre' })).toHaveStyle({ width: '120px' });
  });

  it('sin width reparte el ancho por igual', () => {
    render(<Table caption="Clientes" columns={COLUMNAS} rows={FILAS} getRowKey={getRowKey} />);
    expect(screen.getByRole('columnheader', { name: 'Nombre' })).not.toHaveAttribute('style');
    expect(screen.getByRole('table')).toHaveClass('table-fixed');
  });

  it('medidas: header de 40 px, filas de 48 px, divisor hairline y radios superiores', () => {
    render(<Table caption="Clientes" columns={COLUMNAS} rows={FILAS} getRowKey={getRowKey} />);
    const [nombre, dni] = screen.getAllByRole('columnheader');
    expect(nombre).toHaveClass('h-10', 'px-sp-16', 'rounded-tl-input');
    expect(dni).toHaveClass('rounded-tr-input');
    expect(nombre?.closest('tr')).toHaveClass('bg-surface-subtle');
    const cuerpo = screen.getAllByRole('rowgroup')[1] as HTMLElement;
    for (const fila of within(cuerpo).getAllByRole('row')) expect(fila).toHaveClass('h-12');
    expect(screen.getByRole('cell', { name: 'Ana Pérez' })).toHaveClass(
      'px-sp-16',
      'border-b',
      'border-border-hairline',
    );
  });

  it('menú de fila llama onRowMenu con la fila', async () => {
    const onRowMenu = vi.fn();
    render(
      <Table
        caption="Clientes"
        columns={COLUMNAS}
        rows={FILAS}
        getRowKey={getRowKey}
        onRowMenu={onRowMenu}
      />,
    );
    const botones = screen.getAllByRole('button', { name: 'Acciones de la fila' });
    expect(botones).toHaveLength(2);
    await userEvent.click(botones[1] as HTMLElement);
    expect(onRowMenu).toHaveBeenCalledWith(FILAS[1]);
  });

  it('con onRowMenu el encabezado de acciones es solo para lector de pantalla', () => {
    render(
      <Table
        caption="Clientes"
        columns={COLUMNAS}
        rows={FILAS}
        getRowKey={getRowKey}
        onRowMenu={() => undefined}
      />,
    );
    expect(screen.getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument();
    expect(screen.getByText('Acciones')).toHaveClass('sr-only');
  });

  it('sin onRowMenu no hay columna de menú', () => {
    render(<Table caption="Clientes" columns={COLUMNAS} rows={FILAS} getRowKey={getRowKey} />);
    expect(screen.queryByRole('button', { name: 'Acciones de la fila' })).toBeNull();
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
  });

  it('sin filas renderiza solo el encabezado', () => {
    render(<Table caption="Clientes" columns={COLUMNAS} rows={[]} getRowKey={getRowKey} />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('sin violaciones de accesibilidad', async () => {
    const { container } = render(
      <Table
        caption="Clientes"
        columns={COLUMNAS}
        rows={FILAS}
        getRowKey={getRowKey}
        onRowMenu={() => undefined}
      />,
    );
    expect((await axe(container)).violations).toEqual([]);
  });
});
