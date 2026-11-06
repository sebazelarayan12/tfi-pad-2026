import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Sidebar, type GrupoNav } from './Sidebar';

const usuario = { initials: 'AB', name: 'Ana Bermúdez', role: 'Empleado' };
const grupos: GrupoNav[] = [
  {
    id: 'principal',
    titulo: 'Principal',
    items: [{ label: 'Inicio', icon: 'house', href: '/inicio' }],
  },
  {
    id: 'gestion',
    titulo: 'Gestión',
    items: [{ label: 'Clientes', icon: 'users', href: '/clientes' }],
  },
];

describe('Sidebar', () => {
  it('renderiza los grupos en el orden recibido y un divisor solo entre grupos', () => {
    const { container } = render(<Sidebar grupos={grupos} user={usuario} />);
    const navs = screen.getAllByRole('navigation');
    expect(navs.map((nav) => nav.getAttribute('aria-label'))).toEqual(['Principal', 'Gestión']);
    expect(container.querySelectorAll('hr')).toHaveLength(1);
  });

  it('un grupo sin ítems no se renderiza', () => {
    const { container } = render(
      <Sidebar grupos={[...grupos, { id: 'vacio', titulo: 'Vacío', items: [] }]} user={usuario} />,
    );
    expect(screen.queryByRole('navigation', { name: 'Vacío' })).toBeNull();
    expect(container.querySelectorAll('hr')).toHaveLength(1);
  });

  it('muestra iniciales, nombre y rol del usuario', () => {
    render(<Sidebar grupos={grupos} user={usuario} />);
    expect(screen.getByText('AB')).toBeInTheDocument();
    expect(screen.getByText('Ana Bermúdez')).toBeInTheDocument();
    expect(screen.getByText('Empleado')).toBeInTheDocument();
  });

  it('el nombre largo tiene title con el texto completo', () => {
    const largo = 'Ana María de los Ángeles Bermúdez Etchegaray';
    render(<Sidebar grupos={grupos} user={{ ...usuario, name: largo }} />);
    const nombre = screen.getByText(largo);
    expect(nombre).toHaveAttribute('title', largo);
    expect(nombre).toHaveClass('truncate');
  });

  it('enviar el buscador llama onSearch con el texto sin espacios de los bordes', async () => {
    const onSearch = vi.fn();
    render(<Sidebar grupos={grupos} user={usuario} onSearch={onSearch} />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar' }), '  perez  {Enter}');
    expect(onSearch).toHaveBeenCalledWith('perez');
  });

  it('enviar el buscador vacío no llama onSearch', async () => {
    const onSearch = vi.fn();
    render(<Sidebar grupos={grupos} user={usuario} onSearch={onSearch} />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar' }), '   {Enter}');
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("el buscador tiene una etiqueta accesible 'Buscar'", () => {
    render(<Sidebar grupos={grupos} user={usuario} />);
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Navegación principal' })).toHaveClass(
      'w-[232px]',
      'p-sp-16',
      'gap-sp-16',
    );
  });
});
