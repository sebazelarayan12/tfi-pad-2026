import type { ConsultaPublicaResponse, CuotaPublica } from '@nexa/api';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mesesDeVigencia } from '../schemas/vigencia';
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
      return cuota(8, { estado: 'VENCIDA', recargo: 1250, total: 26250, vencimiento: '2026-10-10' });
    }
    return cuota(numero);
  });
}

function consultaDe(cuotas: CuotaPublica[] = docePolizas()): ConsultaPublicaResponse {
  return {
    numeroPoliza: 'POL-0000042',
    estado: 'VIGENTE',
    coberturaVigente: true,
    vigenteDesde: '2026-03-01',
    vigenteHasta: '2027-03-01',
    plan: { codigo: 'TC', nombre: 'Terceros Completo' },
    vehiculo: { patente: 'AB123CD', marca: 'Toyota', modelo: 'Etios', anio: 2019 },
    cuotas,
  };
}

function estadoDe(cuotas?: CuotaPublica[]) {
  return { dni: '30123456', numeroPoliza: 'POL-0000042', consulta: consultaDe(cuotas) };
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

function casillas() {
  return screen.queryAllByRole('checkbox');
}

afterEach(() => vi.restoreAllMocks());

describe('PolizaPublicaPage: guarda de estado', () => {
  it('sin estado redirige a /consultar-poliza', () => {
    renderizar(null);
    expect(screen.getByTestId('ruta')).toHaveTextContent('/consultar-poliza');
  });

  it('un estado inválido (sin consulta) redirige', () => {
    renderizar({ dni: '30123456', numeroPoliza: 'POL-0000042' });
    expect(screen.getByTestId('ruta')).toHaveTextContent('/consultar-poliza');
  });
});

describe('PolizaPublicaPage: datos de la póliza', () => {
  it('muestra el título, el número y el estado', () => {
    renderizar();
    expect(screen.getByRole('heading', { level: 1, name: 'Mi póliza' })).toBeInTheDocument();
    expect(screen.getByText('POL-0000042')).toHaveClass('font-mono');
    expect(screen.getAllByText('Vigente').length).toBeGreaterThan(0);
  });

  it('muestra vehículo, plan y vigencia', () => {
    renderizar();
    expect(screen.getByText('Toyota Etios 2019')).toBeInTheDocument();
    expect(screen.getByText('Patente AB123CD')).toBeInTheDocument();
    expect(screen.getByText('Terceros Completo (TC)')).toBeInTheDocument();
  });

  it('no muestra Titular ni DNI (PB-07)', () => {
    renderizar();
    expect(screen.queryByText(/titular/i)).toBeNull();
    expect(screen.queryByText(/DNI/)).toBeNull();
    expect(screen.queryByText('30.123.456')).toBeNull();
  });

  it('formatea la vigencia DateOnly sin desfase de zona', () => {
    renderizar();
    expect(screen.getByText('01/03/2026 a 01/03/2027')).toBeInTheDocument();
  });

  it('calcula 12 meses entre vigenteDesde y vigenteHasta', () => {
    renderizar();
    expect(screen.getByText('12 meses')).toBeInTheDocument();
  });

  it('mesesDeVigencia cuenta meses completos y no usa zona horaria', () => {
    expect(mesesDeVigencia('2026-03-01', '2027-03-01')).toBe(12);
    expect(mesesDeVigencia('2026-10-15', '2027-04-15')).toBe(6);
    expect(mesesDeVigencia('2026-10-15', '2026-11-15')).toBe(1);
    expect(mesesDeVigencia('2026-10-15', '2027-04-14')).toBe(5);
  });

  it('muestra el ciclo de la póliza con el texto fijo', () => {
    renderizar();
    expect(screen.getByRole('heading', { name: 'Ciclo de la póliza' })).toBeInTheDocument();
    expect(
      screen.getByText('Pasa de Pendiente a Vigente al pagarse la cuota 1.'),
    ).toBeInTheDocument();
  });
});

describe('PolizaPublicaPage: tabla de cuotas', () => {
  it('muestra una fila por cuota con "Cuota N de T"', () => {
    renderizar();
    const tabla = screen.getByRole('table', { name: 'Cuotas de la póliza' });
    expect(within(tabla).getAllByRole('row')).toHaveLength(13);
    expect(within(tabla).getByText('Cuota 1 de 12')).toBeInTheDocument();
    expect(within(tabla).getByText('Cuota 12 de 12')).toBeInTheDocument();
  });

  it('solo PENDIENTE y VENCIDA tienen casilla', () => {
    renderizar();
    expect(casillas()).toHaveLength(5);
    expect(screen.queryByRole('checkbox', { name: 'Seleccionar cuota 1 de 12' })).toBeNull();
    expect(screen.getByRole('checkbox', { name: 'Seleccionar cuota 8 de 12' })).toBeInTheDocument();
  });

  it('una cuota ANULADA muestra el badge y no tiene casilla', () => {
    renderizar(estadoDe([cuota(1, { estado: 'ANULADA' }), cuota(2)]));
    expect(screen.getByText('Anulada')).toBeInTheDocument();
    expect(casillas()).toHaveLength(1);
  });

  it('la cuota VENCIDA muestra el total con recargo y el texto de recargo', () => {
    renderizar();
    const fila = screen.getByText('Cuota 8 de 12').closest('tr')!;
    expect(fila).toHaveTextContent('10/10/2026, recargo 5%');
    expect(fila).toHaveTextContent('$ 26.250,00');
    expect(within(fila).getByText('Vencida')).toBeInTheDocument();
    expect(screen.getByText('Cuota 9 de 12').closest('tr')).not.toHaveTextContent('recargo');
  });

  it('el caption está oculto y los encabezados tienen scope=col', () => {
    renderizar();
    const tabla = screen.getByRole('table', { name: 'Cuotas de la póliza' });
    expect(tabla.querySelector('caption')).toHaveClass('sr-only');
    const encabezados = within(tabla).getAllByRole('columnheader');
    expect(encabezados.map((th) => th.textContent)).toEqual([
      'Seleccionar',
      'Cuota',
      'Vencimiento',
      'Importe',
      'Estado',
    ]);
    for (const th of encabezados) expect(th).toHaveAttribute('scope', 'col');
  });

  it('una póliza sin cuotas muestra el texto y no la tabla ni el resumen', () => {
    renderizar(estadoDe([]));
    expect(screen.getByText('Esta póliza no tiene cuotas para mostrar.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pagar seleccionadas' })).toBeNull();
  });
});

describe('PolizaPublicaPage: selección y resumen', () => {
  it('sin selección: guion, total $ 0,00 y botones deshabilitados', () => {
    renderizar();
    expect(screen.getByText('Cuotas seleccionadas').closest('dl')).toHaveTextContent('—');
    expect(screen.getByText('Total a pagar').closest('dl')).toHaveTextContent('$ 0,00');
    expect(screen.getByRole('button', { name: 'Pagar seleccionadas' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Descargar cupón Pago Fácil' })).toBeDisabled();
  });

  it('elegir las cuotas 8 y 9 actualiza la lista y el total (aria-live)', async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByRole('checkbox', { name: 'Seleccionar cuota 8 de 12' }));
    await usuario.click(screen.getByRole('checkbox', { name: 'Seleccionar cuota 9 de 12' }));

    expect(screen.getByText('Cuotas seleccionadas').closest('dl')).toHaveTextContent('8 y 9');
    const total = screen.getByText('Total a pagar').closest('dl')!.querySelector('dd')!;
    expect(total).toHaveTextContent('$ 51.250,00');
    expect(total).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('button', { name: 'Pagar seleccionadas' })).toBeEnabled();
  });

  it('Seleccionar impagas marca solo las elegibles', async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByRole('button', { name: 'Seleccionar impagas' }));

    const marcadas = casillas().filter((casilla) => (casilla as HTMLInputElement).checked);
    expect(marcadas).toHaveLength(5);
    expect(screen.getByText('Cuotas seleccionadas').closest('dl')).toHaveTextContent(
      '8, 9, 10, 11 y 12',
    );
  });

  it('Seleccionar impagas no quita las cuotas ya marcadas', async () => {
    const usuario = userEvent.setup();
    renderizar(estadoDe([cuota(1), cuota(2), cuota(3)]));

    await usuario.click(screen.getByRole('checkbox', { name: 'Seleccionar cuota 3 de 3' }));
    await usuario.click(screen.getByRole('button', { name: 'Seleccionar impagas' }));

    expect(screen.getByText('Cuotas seleccionadas').closest('dl')).toHaveTextContent('1, 2 y 3');
  });

  it('el tope de 24 deshabilita las casillas restantes y avisa', async () => {
    const usuario = userEvent.setup();
    const veinticinco = Array.from({ length: 25 }, (_, i) => cuota(i + 1));
    renderizar(estadoDe(veinticinco));

    await usuario.click(screen.getByRole('button', { name: 'Seleccionar impagas' }));

    expect(casillas().filter((c) => (c as HTMLInputElement).checked)).toHaveLength(24);
    expect(screen.getByRole('checkbox', { name: 'Seleccionar cuota 25 de 25' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Podés pagar hasta 24 cuotas por vez.');
  });

  it('Pagar seleccionadas navega a W4 con el estado y las cuotas ordenadas', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(screen.getByRole('checkbox', { name: 'Seleccionar cuota 9 de 12' }));
    await usuario.click(screen.getByRole('checkbox', { name: 'Seleccionar cuota 8 de 12' }));

    await usuario.click(screen.getByRole('button', { name: 'Pagar seleccionadas' }));

    expect(screen.getByTestId('ruta')).toHaveTextContent('/poliza/pagar/medio-de-pago');
    const estado = JSON.parse(screen.getByTestId('estado').textContent ?? 'null') as {
      dni: string;
      numeroPoliza: string;
      cuotaIds: string[];
    };
    expect(estado.dni).toBe('30123456');
    expect(estado.numeroPoliza).toBe('POL-0000042');
    expect(estado.cuotaIds).toEqual([
      'f1000000-0000-0000-0000-000000000008',
      'f1000000-0000-0000-0000-000000000009',
    ]);
  });

  it('Descargar cupón navega a W5 con el mismo estado', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(screen.getByRole('checkbox', { name: 'Seleccionar cuota 8 de 12' }));

    await usuario.click(screen.getByRole('button', { name: 'Descargar cupón Pago Fácil' }));

    expect(screen.getByTestId('ruta')).toHaveTextContent('/poliza/pagar/pago-facil');
    expect(screen.getByTestId('estado')).toHaveTextContent('"cuotaIds":["f1000000-0000-0000-0000-000000000008"]');
  });

  it('no pone datos del cliente en la URL', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(screen.getByRole('checkbox', { name: 'Seleccionar cuota 8 de 12' }));
    await usuario.click(screen.getByRole('button', { name: 'Pagar seleccionadas' }));

    expect(screen.getByTestId('search')).toBeEmptyDOMElement();
  });
});

describe('PolizaPublicaPage: almacenamiento y accesibilidad', () => {
  it('no escribe en localStorage ni sessionStorage', async () => {
    const local = vi.spyOn(Storage.prototype, 'setItem');
    const usuario = userEvent.setup();
    renderizar();
    await usuario.click(screen.getByRole('button', { name: 'Seleccionar impagas' }));
    await usuario.click(screen.getByRole('button', { name: 'Pagar seleccionadas' }));

    expect(local).not.toHaveBeenCalled();
  });

  it('no tiene violaciones de accesibilidad con cuotas seleccionadas', async () => {
    const usuario = userEvent.setup();
    const { container } = renderizar();
    await usuario.click(screen.getByRole('button', { name: 'Seleccionar impagas' }));

    await expectSinViolacionesA11y(container);
  });
});
