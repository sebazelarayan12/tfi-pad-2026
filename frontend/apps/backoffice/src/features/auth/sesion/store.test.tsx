import type { LoginResponse } from '@nexa/api';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CLAVE_SESION } from './almacenamiento';
import {
  alCerrarSesion,
  cerrarSesion,
  emailSesion,
  iniciarSesion,
  sesionActual,
  useRol,
  useSesion,
} from './store';

const AHORA = Date.parse('2026-11-01T08:00:00Z');
const MINUTO = 60_000;

function respuesta(sobrescribir: Partial<LoginResponse> = {}): LoginResponse {
  return {
    token: 'token',
    rol: 'Empleado',
    expiraEn: new Date(AHORA + MINUTO).toISOString(),
    ...sobrescribir,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(AHORA);
});

afterEach(() => {
  cerrarSesion('manual');
  sessionStorage.clear();
  vi.useRealTimers();
});

describe('iniciarSesion', () => {
  it('guarda token, rol y expiraEn en memoria y en storage', () => {
    expect(iniciarSesion(respuesta(), AHORA)).toBe(true);
    expect(sesionActual()).toMatchObject({
      token: 'token',
      rol: 'Empleado',
      expiraEn: new Date(AHORA + MINUTO),
    });
    const guardada = JSON.parse(sessionStorage.getItem(CLAVE_SESION) ?? 'null');
    expect(guardada).toMatchObject({ token: 'token', rol: 'Empleado' });
  });

  it('con expiraEn inválido devuelve false y no guarda', () => {
    expect(iniciarSesion(respuesta({ expiraEn: 'mañana' }), AHORA)).toBe(false);
    expect(sesionActual()).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it('con una sesión que ya no está vigente devuelve false y no guarda', () => {
    const casiVencida = respuesta({ expiraEn: new Date(AHORA + 3_000).toISOString() });
    expect(iniciarSesion(casiVencida, AHORA)).toBe(false);
    expect(sesionActual()).toBeNull();
  });

  it('si storage lanza, la sesión queda en memoria', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('cuota llena', 'QuotaExceededError');
    });
    expect(iniciarSesion(respuesta(), AHORA)).toBe(true);
    expect(sesionActual()?.token).toBe('token');
  });

  it('lee el email del claim del token', () => {
    const payload = btoa(JSON.stringify({ email: 'a@b.com' }));
    iniciarSesion(respuesta({ token: `x.${payload}.y` }), AHORA);
    expect(sesionActual()?.email).toBe('a@b.com');
    expect(emailSesion(sesionActual())).toBe('a@b.com');
  });

  it('emailSesion sin sesión es null', () => {
    expect(emailSesion(null)).toBeNull();
  });

  it('iniciar una sesión nueva reemplaza a la anterior', () => {
    iniciarSesion(respuesta({ token: 'uno' }), AHORA);
    iniciarSesion(respuesta({ token: 'dos', rol: 'Administrador' }), AHORA);
    expect(sesionActual()).toMatchObject({ token: 'dos', rol: 'Administrador' });
  });
});

describe('cerrarSesion', () => {
  it('limpia memoria y storage, ejecuta alCerrarSesion y es idempotente', () => {
    const alCerrar = vi.fn();
    const desregistrar = alCerrarSesion(alCerrar);
    iniciarSesion(respuesta(), AHORA);

    cerrarSesion('manual');
    cerrarSesion('manual');

    expect(sesionActual()).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION)).toBeNull();
    expect(alCerrar).toHaveBeenCalledTimes(1);
    desregistrar();
  });

  it('alCerrarSesion devuelve la función para desregistrar', () => {
    const alCerrar = vi.fn();
    alCerrarSesion(alCerrar)();
    iniciarSesion(respuesta(), AHORA);
    cerrarSesion('manual');
    expect(alCerrar).not.toHaveBeenCalled();
  });

  it('un callback que lanza no impide limpiar ni ejecutar los demás', () => {
    const roto = alCerrarSesion(() => {
      throw new Error('boom');
    });
    const sano = vi.fn();
    const desregistrarSano = alCerrarSesion(sano);
    iniciarSesion(respuesta(), AHORA);

    expect(() => cerrarSesion('no-autorizada')).not.toThrow();
    expect(sesionActual()).toBeNull();
    expect(sano).toHaveBeenCalledTimes(1);
    roto();
    desregistrarSano();
  });
});

describe('vencimiento', () => {
  it('el timer cierra la sesión en expiraEn - 5 s', () => {
    iniciarSesion(respuesta(), AHORA);
    vi.advanceTimersByTime(MINUTO - 5_000 - 1);
    expect(sesionActual()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(sesionActual()).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it('un expiraEn mayor al máximo de setTimeout no rompe el timer (clamp)', () => {
    const lejano = new Date(AHORA + 3_000_000_000).toISOString();
    iniciarSesion(respuesta({ expiraEn: lejano }), AHORA);
    vi.advanceTimersByTime(1);
    expect(sesionActual()).not.toBeNull();
    vi.advanceTimersByTime(2_147_483_647);
    expect(sesionActual()).toBeNull();
  });

  it('cerrar la sesión cancela el timer', () => {
    const alCerrar = vi.fn();
    const desregistrar = alCerrarSesion(alCerrar);
    iniciarSesion(respuesta(), AHORA);
    cerrarSesion('manual');
    vi.advanceTimersByTime(MINUTO);
    expect(alCerrar).toHaveBeenCalledTimes(1);
    desregistrar();
  });
});

describe('restauración', () => {
  it('al cargar el módulo restaura una sesión vigente de sessionStorage', async () => {
    sessionStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({
        token: 'guardado',
        rol: 'Administrador',
        expiraEn: new Date(AHORA + MINUTO).toISOString(),
        email: 'a@b.com',
      }),
    );
    vi.resetModules();
    const store = await import('./store');
    expect(store.sesionActual()).toMatchObject({ token: 'guardado', rol: 'Administrador' });
    store.cerrarSesion('manual');
  });

  it('al cargar el módulo ignora una sesión vencida', async () => {
    sessionStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({
        token: 'viejo',
        rol: 'Empleado',
        expiraEn: new Date(AHORA - MINUTO).toISOString(),
        email: null,
      }),
    );
    vi.resetModules();
    const store = await import('./store');
    expect(store.sesionActual()).toBeNull();
  });
});

describe('hooks', () => {
  it('useSesion y useRol siguen los cambios de la sesión', () => {
    const sesion = renderHook(() => useSesion());
    const rol = renderHook(() => useRol());
    expect(sesion.result.current).toBeNull();
    expect(rol.result.current).toBeNull();

    act(() => {
      iniciarSesion(respuesta({ rol: 'Administrador' }), AHORA);
    });
    expect(sesion.result.current?.token).toBe('token');
    expect(rol.result.current).toBe('Administrador');

    act(() => {
      cerrarSesion('manual');
    });
    expect(sesion.result.current).toBeNull();
    expect(rol.result.current).toBeNull();
  });
});
