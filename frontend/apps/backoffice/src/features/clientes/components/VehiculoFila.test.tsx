import type { VehiculoResponse } from '@nexa/api';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { VehiculoFila, type EstadoPolizasFila } from './VehiculoFila';

const base: VehiculoResponse = {
  id: 'v1',
  clienteId: 'c1',
  patente: 'AB123CD',
  marca: 'Toyota',
  modelo: 'Etios',
  anio: 2019,
  tipo: 0,
  uso: 0,
  validadoDnrpa: false,
  activo: true,
};

function montar(vehiculo: VehiculoResponse, estadoPolizas: EstadoPolizasFila = 'listo') {
  return render(
    <MemoryRouter>
      <ul>
        <VehiculoFila vehiculo={vehiculo} poliza={undefined} estadoPolizas={estadoPolizas} />
      </ul>
    </MemoryRouter>,
  );
}

describe('VehiculoFila', () => {
  it('tipo 0 y uso 0 muestran Auto · Particular', () => {
    montar(base);
    expect(screen.getByText('Auto · Particular')).toBeInTheDocument();
    expect(screen.getByText('Toyota Etios 2019')).toBeInTheDocument();
  });

  it('una moto comercial muestra Moto · Comercial', () => {
    montar({ ...base, tipo: 1, uso: 1 });
    expect(screen.getByText('Moto · Comercial')).toBeInTheDocument();
  });

  it('muestra DNRPA solo si el vehículo está validado', () => {
    const { unmount } = montar(base);
    expect(screen.queryByText('DNRPA')).toBeNull();
    unmount();
    montar({ ...base, validadoDnrpa: true });
    expect(screen.getByText('DNRPA')).toBeInTheDocument();
  });

  it('mientras las pólizas cargan no afirma Sin póliza activa', () => {
    montar(base, 'cargando');
    expect(screen.queryByText('Sin póliza activa')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Cotizar' })).toBeNull();
  });

  it('si las pólizas fallaron no muestra póliza ni Cotizar', () => {
    montar(base, 'error');
    expect(screen.queryByText('Sin póliza activa')).toBeNull();
  });
});
