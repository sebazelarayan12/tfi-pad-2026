import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { COPYRIGHT_PUBLICO } from './contenidoPublico';
import { PublicLayout } from './PublicLayout';

const renderEn = (ruta: string) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/prueba" element={<p>Contenido de prueba</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('PublicLayout', () => {
  it('compone nav, main y footer dentro del shell', () => {
    const { container } = renderEn('/prueba');
    const header = container.querySelector('header');
    const main = container.querySelector('main#contenido');
    const footer = container.querySelector('footer#contacto');
    expect(header).not.toBeNull();
    expect(main).not.toBeNull();
    expect(footer).not.toBeNull();
    expect(container.querySelector('.shadow-shell')).toContainElement(main as HTMLElement);
    // Orden en el documento: nav, main y footer.
    expect(header?.compareDocumentPosition(main as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(main?.compareDocumentPosition(footer as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByText(COPYRIGHT_PUBLICO)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Consultar póliza' })).toHaveAttribute(
      'href',
      '/consultar-poliza',
    );
  });

  it('renderiza el contenido de la ruta dentro de main', () => {
    renderEn('/prueba');
    expect(screen.getByRole('main')).toContainElement(screen.getByText('Contenido de prueba'));
  });
});
