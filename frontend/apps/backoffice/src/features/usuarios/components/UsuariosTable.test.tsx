import type { UsuarioListItemMock } from '@nexa/api';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UsuariosTable } from './UsuariosTable';

const HERNAN: UsuarioListItemMock = {
  id: 'u-1',
  email: 'hernan.sosa@nexaseguros.com.ar',
  nombre: 'Hernán',
  apellido: 'Sosa',
  rol: 'Administrador',
  activo: true,
  ultimoIngreso: '2026-11-01T10:00:00Z',
};
const MARIELA: UsuarioListItemMock = {
  id: 'u-2',
  email: 'mariela.quiroga@nexaseguros.com.ar',
  nombre: 'Mariela',
  apellido: 'Quiroga',
  rol: 'Empleado',
  activo: false,
  ultimoIngreso: null,
};

function montar(props: Partial<Parameters<typeof UsuariosTable>[0]> = {}) {
  return render(
    <UsuariosTable
      usuarios={[HERNAN, MARIELA]}
      cargando={false}
      errorDetalle={undefined}
      emailSesion={null}
      onEditar={vi.fn()}
      onDesactivar={vi.fn()}
      onActivar={vi.fn()}
      {...props}
    />,
  );
}

describe('UsuariosTable', () => {
  it('muestra Usuario, Rol y Estado, y no la columna Último ingreso', () => {
    montar();
    ['Usuario', 'Rol', 'Estado'].forEach((nombre) =>
      expect(screen.getByRole('columnheader', { name: nombre })).toBeInTheDocument(),
    );
    expect(screen.queryByText('Último ingreso')).toBeNull();
    expect(screen.queryByText('Nunca ingresó')).toBeNull();
  });

  it('cada fila muestra nombre y apellido, email, rol y estado', () => {
    montar();
    const fila = screen.getByRole('row', { name: /Hernán Sosa/ });
    expect(within(fila).getByText('Hernán Sosa')).toBeInTheDocument();
    expect(within(fila).getByText('hernan.sosa@nexaseguros.com.ar')).toBeInTheDocument();
    expect(within(fila).getByText('Administrador')).toHaveClass('bg-accent-lime');
    expect(within(fila).getByText('Activo')).toBeInTheDocument();
    const otra = screen.getByRole('row', { name: /Mariela Quiroga/ });
    expect(within(otra).getByText('Empleado')).toHaveClass('bg-surface-subtle');
  });

  it('el avatar con iniciales es decorativo', () => {
    montar();
    const iniciales = screen.getByText('HS');
    expect(iniciales).toHaveAttribute('aria-hidden', 'true');
  });

  it('un usuario inactivo muestra Inactivo', () => {
    montar();
    const fila = screen.getByRole('row', { name: /Mariela Quiroga/ });
    expect(within(fila).getByText('Inactivo')).toBeInTheDocument();
  });

  it('lista vacía, error de carga y carga en curso', () => {
    const vacia = montar({ usuarios: [] });
    expect(screen.getByText('No hay usuarios.')).toBeInTheDocument();
    vacia.unmount();

    const error = montar({ usuarios: undefined, errorDetalle: 'Sin conexión.' });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudieron cargar los usuarios. Sin conexión.',
    );
    error.unmount();

    montar({ usuarios: undefined, cargando: true });
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByText('No hay usuarios.')).toBeNull();
  });

  it('el menú de una fila lleva el nombre accesible Acciones de {nombre}', () => {
    montar();
    expect(screen.getByRole('button', { name: 'Acciones de Hernán Sosa' })).toBeInTheDocument();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = montar();
    await expectSinViolacionesA11y(container);
  });
});
