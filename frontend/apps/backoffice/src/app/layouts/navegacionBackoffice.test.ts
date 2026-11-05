import type { GrupoNav } from '@nexa/ui';
import { describe, expect, it } from 'vitest';

import { gruposParaRol, NAV_ADMIN, NAV_PRINCIPAL } from './navegacionBackoffice';

const etiquetas = (grupo: GrupoNav) => grupo.items.map((item) => String(item.label));

describe('gruposParaRol', () => {
  it('sin rol no devuelve grupos', () => {
    expect(gruposParaRol(null)).toEqual([]);
  });

  it('Empleado solo ve el grupo principal', () => {
    expect(gruposParaRol('Empleado')).toEqual([NAV_PRINCIPAL]);
  });

  it('Administrador ve el grupo principal y el de administración', () => {
    expect(gruposParaRol('Administrador')).toEqual([NAV_PRINCIPAL, NAV_ADMIN]);
  });

  it('el grupo principal mantiene el orden del diseño', () => {
    expect(etiquetas(NAV_PRINCIPAL)).toEqual([
      'Inicio',
      'Clientes',
      'Vehículos',
      'Cotizaciones',
      'Pólizas',
      'Pagos y facturas',
      'Pago Fácil',
    ]);
    expect(etiquetas(NAV_ADMIN)).toEqual(['Planes', 'Usuarios']);
  });

  it('Vehículos y Cotizaciones no tienen destino todavía', () => {
    const sinHref = NAV_PRINCIPAL.items.filter((item) => item.href === undefined);
    expect(sinHref.map((item) => item.label)).toEqual(['Vehículos', 'Cotizaciones']);
  });
});
