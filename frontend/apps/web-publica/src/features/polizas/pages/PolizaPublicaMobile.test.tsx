import type { ConsultaPublicaResponse, CuotaPublica } from '@nexa/api';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PolizaPublicaPage } from './PolizaPublicaPage';

function cuota(numero: number, parcial: Partial<CuotaPublica> = {}): CuotaPublica {
  return {
    idCuota: `f1000000-0000-0000-0000-${String(numero).padStart(12, '0')}`,
    numero,
    importe: 25000,
    recargo: 0,
    total: 25000,
    vencimiento: '2026-11-10',
    estado: 'PENDIENTE',
    ...parcial,
  };
}

/** 12 cuotas: 1 a 7 pagadas, la 8 vencida con recargo y la 9 a 12 pendientes. */
function docePolizas(): CuotaPublica[] {
  return Array.from({ length: 12 }, (_, i) => {
    const numero = i + 1;
    if (numero <= 7) return cuota(numero, { estado: 'PAGADA' });
    if (numero === 8) {
      return cuota(8, {
        estado: 'VENCIDA',
        recargo: 1250,
        total: 26250,
        vencimiento: '2026-10-10',
      });
    }
    return cuota(numero);
  });
}

function estadoDe(cuotas: CuotaPublica[] = docePolizas()) {
  const consulta: ConsultaPublicaResponse = {
    numeroPoliza: 'POL-0000042',
    estado: 'VIGENTE',
    coberturaVigente: true,
    vigenteDesde: '2026-03-01',
    vigenteHasta: '2027-03-01',
    plan: { codigo: 'TC', nombre: 'Terceros Completo' },
    vehiculo: { patente: 'AB123CD', marca: 'Toyota', modelo: 'Etios', anio: 2019 },
    cuotas,
  };
  return { dni: '30123456', numeroPoliza: 'POL-0000042', consulta };
}

function Sonda() {
  const ubicacion = useLocation();
  return (
    <>
      <p data-testid="ruta">{ubicacion.pathname}</p>
      <p data-testid="search">{ubicacion.search}</p>
      <pre data-testid="estado">{JSON.stringify(ubicacion.state ?? null)}</pre>
    </>
  );
}

function renderizar(state: unknown = estadoDe()) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/poliza', state }]}>
      <Routes>
        <Route path="/poliza" element={<PolizaPublicaPage />} />
        <Route path="*" element={<Sonda />} />
      </Routes>
    </MemoryRouter>,
  );
}

const casilla = (numero: number) =>
  screen.getByRole('checkbox', { name: `Seleccionar cuota ${numero} de 12` });

beforeEach(() => {
  // Menos de 768 px: `useEsEscritorio()` devuelve false.
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('PolizaPublicaPage: vista móvil', () => {
  it('la lista de cuotas es una lista de 12 items y no hay tabla', () => {
    renderizar();
    expect(screen.queryByRole('table')).toBeNull();
    const lista = screen
      .getAllByRole('list')
      .find((elemento) => within(elemento).queryAllByRole('listitem').length === 12);
    expect(lista).toBeDefined();
  });

  it('cada casilla tiene el aria-label con la cuota y el total', () => {
    renderizar();
    expect(casilla(8)).toBeInTheDocument();
    expect(casilla(12)).toBeInTheDocument();
  });

  it('las cuotas pagadas no tienen casilla', () => {
    renderizar();
    expect(screen.queryByRole('checkbox', { name: 'Seleccionar cuota 1 de 12' })).toBeNull();
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
  });

  it('muestra el vencimiento con recargo en la cuota vencida', () => {
    renderizar();
    expect(screen.getByText('10/10/2026, recargo 5%')).toBeInTheDocument();
  });

  it('la barra muestra el total de las cuotas seleccionadas', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(casilla(8));
    await usuario.click(casilla(9));
    expect(screen.getByText('Total a pagar (cuotas 8 y 9)')).toBeInTheDocument();
    expect(screen.getByText(/51\.250,00/)).toBeInTheDocument();
  });

  it('la barra con una cuota usa la forma singular', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(casilla(8));
    expect(screen.getByText('Total a pagar (cuota 8)')).toBeInTheDocument();
  });

  it('la barra con tres cuotas usa la forma de lista con coma', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(casilla(8));
    await usuario.click(casilla(9));
    await usuario.click(casilla(10));
    expect(screen.getByText('Total a pagar (cuotas 8, 9 y 10)')).toBeInTheDocument();
  });

  it('sin selección la barra dice Total a pagar con $ 0,00 y Pagar y el cupón están deshabilitados', () => {
    renderizar();
    expect(screen.getByText('Total a pagar')).toBeInTheDocument();
    expect(screen.getByText(/\$\s*0,00/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Descargar cupón Pago Fácil' })).toBeDisabled();
  });

  it('Pagar navega a medio de pago con las cuotas en el estado', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(casilla(8));
    await usuario.click(screen.getByRole('button', { name: 'Pagar' }));
    expect(screen.getByTestId('ruta')).toHaveTextContent('/poliza/pagar/medio-de-pago');
    const estado = JSON.parse(screen.getByTestId('estado').textContent ?? 'null') as {
      cuotaIds: string[];
    };
    expect(estado.cuotaIds).toEqual([docePolizas()[7]!.idCuota]);
  });

  it('el botón del cupón navega a Pago Fácil con el mismo estado', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(casilla(9));
    await usuario.click(screen.getByRole('button', { name: 'Descargar cupón Pago Fácil' }));
    expect(screen.getByTestId('ruta')).toHaveTextContent('/poliza/pagar/pago-facil');
    expect(screen.getByTestId('estado')).toHaveTextContent(docePolizas()[8]!.idCuota);
  });

  it('el DNI no aparece en la URL al navegar', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(casilla(8));
    await usuario.click(screen.getByRole('button', { name: 'Pagar' }));
    expect(screen.getByTestId('search')).toBeEmptyDOMElement();
    expect(screen.getByTestId('ruta').textContent).not.toContain('30123456');
  });

  it('el importe de la barra tiene aria-live polite', () => {
    renderizar();
    expect(screen.getByText(/\$\s*0,00/)).toHaveAttribute('aria-live', 'polite');
  });

  it('Seleccionar impagas agrega todas las impagas y la barra las lista', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(screen.getByRole('button', { name: 'Seleccionar impagas' }));
    expect(screen.getByText('Total a pagar (cuotas 8, 9, 10, 11 y 12)')).toBeInTheDocument();
  });

  it('una póliza sin cuotas muestra el texto de vacío y no la barra', () => {
    renderizar(estadoDe([]));
    expect(screen.getByText('Esta póliza no tiene cuotas para mostrar.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pagar' })).toBeNull();
  });

  it('no tiene violaciones de accesibilidad en móvil', async () => {
    const { container } = renderizar();
    await expectSinViolacionesA11y(container);
  });
});
