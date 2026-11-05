import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { PublicNav } from './PublicNav';

const links = [
  { label: 'Planes', href: '#planes' },
  { label: 'Contacto', href: '#contacto' },
];

const renderNav = () =>
  render(<PublicNav links={links} ctaLabel="Consultar póliza" ctaHref="/consultar-poliza" />);

describe('PublicNav', () => {
  it('muestra la marca y el monograma', () => {
    renderNav();
    const logo = screen.getByRole('link', { name: 'Nexa Seguros' });
    expect(logo).toHaveAttribute('href', '/');
    expect(screen.getByText('N')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renderiza los links con su href', () => {
    renderNav();
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(nav.querySelector('a[href="#planes"]')).toHaveTextContent('Planes');
    expect(nav.querySelector('a[href="#contacto"]')).toHaveTextContent('Contacto');
  });

  it('el botón primario apunta a ctaHref', () => {
    renderNav();
    expect(screen.getByRole('link', { name: 'Consultar póliza' })).toHaveAttribute(
      'href',
      '/consultar-poliza',
    );
  });

  it('mide 72 px de alto con padding horizontal de 24 px', () => {
    const { container } = renderNav();
    expect(container.querySelector('header > div')).toHaveClass('h-[72px]', 'px-sp-24');
  });

  it('el menú mobile tiene aria-expanded y lo alterna', async () => {
    renderNav();
    const boton = screen.getByRole('button', { name: 'Abrir menú' });
    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: 'Principal (móvil)' })).toBeNull();
    await userEvent.click(boton);
    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(boton).toHaveAccessibleName('Cerrar menú');
    const menu = screen.getByRole('navigation', { name: 'Principal (móvil)' });
    expect(menu).toHaveTextContent('Planes');
    expect(menu).toHaveTextContent('Contacto');
  });

  it('Escape cierra el menú mobile y devuelve el foco', async () => {
    renderNav();
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await userEvent.tab();
    await userEvent.keyboard('{Escape}');
    const boton = screen.getByRole('button', { name: 'Abrir menú' });
    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(boton).toHaveFocus();
  });

  it('sin links renderiza solo logo y botón', () => {
    render(<PublicNav links={[]} ctaLabel="Consultar póliza" ctaHref="/consultar-poliza" />);
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual([
      'NNexa Seguros',
      'Consultar póliza',
    ]);
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = renderNav();
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect((await axe(container)).violations).toEqual([]);
  });
});
