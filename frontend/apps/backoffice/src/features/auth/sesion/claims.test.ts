import { describe, expect, it } from 'vitest';

import { leerEmailDelToken } from './claims';

function base64url(texto: string): string {
  return btoa(texto).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function jwt(payload: unknown): string {
  return `${base64url('{"alg":"none"}')}.${base64url(JSON.stringify(payload))}.firma-falsa`;
}

describe('leerEmailDelToken', () => {
  it('lee email del payload sin verificar la firma', () => {
    expect(leerEmailDelToken(jwt({ email: 'empleado@ejemplo.com' }))).toBe('empleado@ejemplo.com');
  });

  it('lee un payload cuyo base64url usa guiones y guiones bajos', () => {
    const email = '>>>???@ejemplo.com';
    expect(leerEmailDelToken(jwt({ email }))).toBe(email);
  });

  it('token malformado devuelve null y no lanza', () => {
    expect(leerEmailDelToken('no-es-un-jwt')).toBeNull();
    expect(leerEmailDelToken('a.%%%.c')).toBeNull();
    expect(leerEmailDelToken(`a.${base64url('no es json')}.c`)).toBeNull();
    expect(leerEmailDelToken('')).toBeNull();
  });

  it('sin claim email, o con email que no es string, devuelve null', () => {
    expect(leerEmailDelToken(jwt({ sub: '1' }))).toBeNull();
    expect(leerEmailDelToken(jwt({ email: 42 }))).toBeNull();
    expect(leerEmailDelToken(jwt(null))).toBeNull();
  });
});
