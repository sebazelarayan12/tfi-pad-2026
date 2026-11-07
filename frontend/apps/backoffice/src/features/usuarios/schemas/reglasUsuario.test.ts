import { describe, expect, it } from 'vitest';

import {
  esCuentaPropia,
  esUltimoAdministradorActivo,
  motivoBloqueoDesactivar,
  MOTIVO_CUENTA_PROPIA,
  MOTIVO_ULTIMO_ADMINISTRADOR,
} from './reglasUsuario';

const admin = { email: 'admin@example.test', rol: 'Administrador', activo: true } as const;
const otroAdmin = { email: 'otro@example.test', rol: 'Administrador', activo: true } as const;
const adminInactivo = { email: 'viejo@example.test', rol: 'Administrador', activo: false } as const;
const empleado = { email: 'emp@example.test', rol: 'Empleado', activo: true } as const;

describe('reglasUsuario (D-B25-02)', () => {
  it('esCuentaPropia compara el email sin distinguir mayúsculas y sin sesión es false', () => {
    expect(esCuentaPropia(admin, 'ADMIN@example.test')).toBe(true);
    expect(esCuentaPropia(admin, 'otro@example.test')).toBe(false);
    expect(esCuentaPropia(admin, null)).toBe(false);
  });

  it('el único administrador activo es el último, aunque haya otros inactivos o empleados', () => {
    expect(esUltimoAdministradorActivo(admin, [admin, adminInactivo, empleado])).toBe(true);
  });

  it('con dos administradores activos ninguno es el último', () => {
    expect(esUltimoAdministradorActivo(admin, [admin, otroAdmin])).toBe(false);
  });

  it('un empleado o un administrador inactivo nunca es el último administrador', () => {
    expect(esUltimoAdministradorActivo(empleado, [admin, empleado])).toBe(false);
    expect(esUltimoAdministradorActivo(adminInactivo, [admin, adminInactivo])).toBe(false);
  });

  it('el bloqueo prioriza la cuenta propia y no aplica a quien ya está inactivo', () => {
    expect(motivoBloqueoDesactivar(admin, [admin], 'admin@example.test')).toBe(
      MOTIVO_CUENTA_PROPIA,
    );
    expect(motivoBloqueoDesactivar(admin, [admin, empleado], 'emp@example.test')).toBe(
      MOTIVO_ULTIMO_ADMINISTRADOR,
    );
    expect(motivoBloqueoDesactivar(adminInactivo, [admin, adminInactivo], null)).toBeNull();
    expect(motivoBloqueoDesactivar(empleado, [admin, empleado], 'admin@example.test')).toBeNull();
  });
});
