import type { ClienteResumenResponse } from '@nexa/api';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { TablaClientes } from './TablaClientes';

const BASE: ClienteResumenResponse = {
  id: 'c1000000-0000-0000-0000-000000000001',
  dni: '30123456',
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'juan@example.test',
  telefono: null,
  activo: true,
  validadoRenaper: false,
  cantidadVehiculos: 0,
  cantidadPolizasActivas: 0,
};

function montar(cliente: ClienteResumenResponse) {
  render(
    <MemoryRouter>
      <TablaClientes clientes={[cliente]} cargando={false} buscando={false} onLimpiar={() => {}} />
    </MemoryRouter>,
  );
  return within(screen.getAllByRole('row')[1]!).getAllByRole('cell');
}

describe('TablaClientes', () => {
  it('cliente sin validar en Renaper y sin vehículos ni pólizas: Pendiente y ceros reales', () => {
    const celdas = montar(BASE);
    expect(celdas[4]).toHaveTextContent('0');
    expect(celdas[5]).toHaveTextContent('Pendiente');
    expect(celdas[6]).toHaveTextContent('0');
  });

  it('cliente validado con vehículos y pólizas activas: Validado y sus cantidades', () => {
    const celdas = montar({
      ...BASE,
      validadoRenaper: true,
      cantidadVehiculos: 2,
      cantidadPolizasActivas: 3,
    });
    expect(celdas[4]).toHaveTextContent('2');
    expect(celdas[5]).toHaveTextContent('Validado');
    expect(celdas[6]).toHaveTextContent('3');
  });
});
