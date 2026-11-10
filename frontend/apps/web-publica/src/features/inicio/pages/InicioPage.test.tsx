import { ApiClientProvider, createApiClient } from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { InicioPage } from './InicioPage';

beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
afterEach(() => servidorMock.resetHandlers());
afterAll(() => servidorMock.close());

function renderizar() {
  const queryClient = new QueryClient();
  const cliente = createApiClient({ baseUrl: 'http://localhost' });
  return render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <InicioPage />
        </MemoryRouter>
      </QueryClientProvider>
    </ApiClientProvider>,
  );
}

/** La home terminó de cargar cuando la tabla muestra el primer importe del endpoint. */
async function renderizarCargada() {
  const resultado = renderizar();
  await screen.findByText('$ 12.000,00');
  return resultado;
}

function seccion(nombre: string) {
  return screen.getByRole('region', { name: nombre });
}

describe('InicioPage', () => {
  it('muestra el h1 del hero', async () => {
    await renderizarCargada();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Tu vehículo asegurado, tu póliza siempre a mano.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Consultá el estado de tu póliza, revisá tus cuotas y pagalas online o en efectivo.',
      ),
    ).toBeInTheDocument();
  });

  it('CTA Consultar póliza enlaza a /consultar-poliza', async () => {
    await renderizarCargada();
    const enlaces = screen.getAllByRole('link', { name: 'Consultar póliza' });
    // El del hero y los de las tarjetas "Pago online" y "Efectivo con Pago Fácil".
    expect(enlaces).toHaveLength(3);
    for (const enlace of enlaces) expect(enlace).toHaveAttribute('href', '/consultar-poliza');
  });

  it('CTA Ver planes enlaza al ancla #planes', async () => {
    const { container } = await renderizarCargada();
    // El del hero y uno por tarjeta de vehículo: todos bajan a la tabla de planes.
    const enlaces = screen.getAllByRole('link', { name: 'Ver planes' });
    expect(enlaces).toHaveLength(3);
    for (const enlace of enlaces) expect(enlace).toHaveAttribute('href', '#planes');
    expect(container.querySelector('#planes')).toBe(seccion('Planes'));
  });

  it('el chip Valores de referencia no es interactivo', async () => {
    await renderizarCargada();
    expect(screen.getByText('Valores de referencia').tagName).toBe('SPAN');
    expect(screen.queryByRole('button', { name: 'Valores de referencia' })).toBeNull();
  });

  it('la sección Planes muestra la tabla con los planes del endpoint', async () => {
    await renderizarCargada();
    const planes = seccion('Planes');
    const encabezados = within(planes).getAllByRole('columnheader');
    expect(encabezados.map((th) => th.textContent)).toEqual([
      'RCResponsabilidad Civil',
      'TCTerceros Completo',
      'TRTodo Riesgo',
    ]);
    expect(within(planes).getByText('$ 18.000,00')).toBeInTheDocument();
    expect(within(planes).getByText('$ 30.000,00')).toBeInTheDocument();
    expect(
      within(planes).getByText('La prima final depende del vehículo y se informa al cotizar.'),
    ).toBeInTheDocument();
  });

  it('Cómo pagar muestra dos tarjetas con los títulos literales', async () => {
    await renderizarCargada();
    const comoPagar = seccion('Cómo pagar');
    expect(
      within(comoPagar)
        .getAllByRole('heading', { level: 3 })
        .map((titulo) => titulo.textContent),
    ).toEqual(['Pago online', 'Efectivo con Pago Fácil']);
    expect(
      within(comoPagar).getByText(
        'Elegí Pasarela A o Pasarela B y pagá con tarjeta o dinero en cuenta.',
      ),
    ).toBeInTheDocument();
    expect(
      within(comoPagar).getByText(
        'Pagá en efectivo con el cupón de Pago Fácil, que tiene un código de barras de 42 dígitos.',
      ),
    ).toBeInTheDocument();
  });

  it('la tarjeta B lleva a consultar la póliza y no tiene botón', async () => {
    await renderizarCargada();
    const tarjetaB = screen
      .getByRole('heading', { name: 'Efectivo con Pago Fácil' })
      .closest('section') as HTMLElement;
    expect(within(tarjetaB).getByRole('link', { name: 'Consultar póliza' })).toHaveAttribute(
      'href',
      '/consultar-poliza',
    );
    expect(within(tarjetaB).queryByRole('button')).toBeNull();
    expect(screen.queryByText('Ver ejemplo de cupón')).toBeNull();
  });

  it('las fotos tienen texto alternativo y las tarjetas flotantes del hero están ocultas', async () => {
    await renderizarCargada();
    const fotos = screen.getAllByRole('img');
    expect(fotos).toHaveLength(3);
    for (const foto of fotos) expect(foto).toHaveAccessibleName();
    expect(screen.getByText('Cobertura activa').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('muestra beneficios y un plan para cada vehículo', async () => {
    await renderizarCargada();
    expect(
      within(seccion('Por qué elegir Nexa'))
        .getAllByRole('heading', { level: 3 })
        .map((titulo) => titulo.textContent),
    ).toEqual([
      'Consultá en un minuto',
      'Pagá como prefieras',
      'Cuentas claras',
      'Tu factura, siempre',
    ]);
    expect(
      within(seccion('Un plan para cada vehículo'))
        .getAllByRole('heading', { level: 3 })
        .map((titulo) => titulo.textContent),
    ).toEqual(['Autos y camionetas', 'Motos']);
  });

  it('las preguntas frecuentes empiezan cerradas y se abren con su resumen', async () => {
    await renderizarCargada();
    const preguntas = within(seccion('Preguntas frecuentes'));
    const resumen = preguntas.getByText('¿Cuándo vencen las cuotas?');
    const detalle = resumen.closest('details') as HTMLDetailsElement;
    expect(preguntas.getAllByText(/^¿/)).toHaveLength(4);
    expect(detalle.open).toBe(false);
    await userEvent.click(resumen);
    expect(detalle.open).toBe(true);
  });

  it('no hay campos de formulario', async () => {
    await renderizarCargada();
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(document.querySelector('form, input, select, textarea')).toBeNull();
  });

  it('no escribe en almacenamiento', async () => {
    const local = vi.spyOn(Storage.prototype, 'setItem');
    await renderizarCargada();
    expect(local).not.toHaveBeenCalled();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = await renderizarCargada();
    await expectSinViolacionesA11y(container);
  });
});
