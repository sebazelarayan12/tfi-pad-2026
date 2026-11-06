import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Sesion } from '../types/sesion';
import { borrar, CLAVE_SESION, guardar, leer } from './almacenamiento';

const AHORA = Date.parse('2026-11-01T08:00:00Z');
const sesion: Sesion = {
  token: 'token',
  rol: 'Empleado',
  expiraEn: new Date(AHORA + 60_000),
  email: 'a@b.com',
  debeCambiarPassword: false,
};

afterEach(() => {
  sessionStorage.clear();
});

describe('almacenamiento de la sesión', () => {
  it('la clave es nexa.backoffice.sesion', () => {
    expect(CLAVE_SESION).toBe('nexa.backoffice.sesion');
  });

  it('guarda y lee la sesión', () => {
    guardar(sesion);
    expect(leer(AHORA)).toEqual(sesion);
  });

  it('persiste token, rol, expiraEn en ISO y email', () => {
    guardar(sesion);
    expect(JSON.parse(sessionStorage.getItem(CLAVE_SESION) ?? 'null')).toEqual({
      token: 'token',
      rol: 'Empleado',
      expiraEn: '2026-11-01T08:01:00.000Z',
      email: 'a@b.com',
      debeCambiarPassword: false,
    });
  });

  it('borrar elimina la clave', () => {
    guardar(sesion);
    borrar();
    expect(sessionStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it('sin nada guardado devuelve null', () => {
    expect(leer(AHORA)).toBeNull();
  });

  it('JSON corrupto devuelve null y borra la clave', () => {
    sessionStorage.setItem(CLAVE_SESION, '{no es json');
    expect(leer(AHORA)).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it('una forma inválida devuelve null y borra la clave', () => {
    sessionStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({ token: 'x', rol: 'Superusuario', expiraEn: sesion.expiraEn }),
    );
    expect(leer(AHORA)).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it('una sesión vencida se borra al leer', () => {
    guardar(sesion);
    expect(leer(AHORA + 60_000)).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it('una sesión a menos de 5 s de vencer se borra al leer', () => {
    guardar(sesion);
    expect(leer(AHORA + 55_000)).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it('setItem que lanza no rompe guardar', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('cuota llena', 'QuotaExceededError');
    });
    expect(() => guardar(sesion)).not.toThrow();
  });

  it('getItem que lanza devuelve null', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('sin acceso', 'SecurityError');
    });
    expect(leer(AHORA)).toBeNull();
  });

  it('removeItem que lanza no rompe borrar', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('sin acceso', 'SecurityError');
    });
    expect(() => borrar()).not.toThrow();
  });
});
