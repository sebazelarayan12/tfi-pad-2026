// @vitest-environment node
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { servidorMock } from '../../mocks/server';
import {
  ejecutarError,
  ejecutarExito,
  motivoOmision,
  validarProblemDetails,
  validarRespuesta,
  type DefinicionEndpoint,
} from './harness';
import { fetchContrato, leerConfiguracion } from './setup';

const esModoReal = process.env.CONTRACT_TARGET === 'real';
const RUTA = '/api/contrato-de-prueba';
const esquemaPlan = z.looseObject({ id: z.string(), nombre: z.string() });

function endpointDePrueba(): DefinicionEndpoint {
  return {
    nombre: 'Endpoint de prueba',
    metodo: 'GET',
    ruta: RUTA,
    requiereSesion: false,
    destructivo: false,
    exito: { estado: 200, esquema: esquemaPlan, request: () => fetchContrato(RUTA) },
    errores: [],
  };
}

describe('validarRespuesta', () => {
  it('acepta un cuerpo que cumple el esquema', () => {
    const plan = validarRespuesta(esquemaPlan, { id: 'a', nombre: 'Plan' });

    expect(plan.id).toBe('a');
    expect(plan.nombre).toBe('Plan');
  });

  it('rechaza un campo requerido faltante y nombra su ruta', () => {
    expect(() => validarRespuesta(esquemaPlan, { id: 'a' })).toThrow(/nombre/);
  });

  it('acepta campos extra', () => {
    expect(() =>
      validarRespuesta(esquemaPlan, { id: 'a', nombre: 'Plan', codigo: 'CLIENTE_NO_ENCONTRADO' }),
    ).not.toThrow();
  });
});

describe('validarProblemDetails', () => {
  it('acepta ProblemDetails sin detail (forma C)', () => {
    expect(() => validarProblemDetails({ status: 401 })).not.toThrow();
  });

  it('rechaza status como texto', () => {
    expect(() => validarProblemDetails({ status: '401' })).toThrow(/status/);
  });

  it('de validación exige errors con arreglos de texto', () => {
    expect(() =>
      validarProblemDetails({ status: 400, errors: { Dni: 'x' } }, 'validation'),
    ).toThrow(/errors/);
    expect(() =>
      validarProblemDetails({ status: 400, errors: { Dni: ['x'] } }, 'validation'),
    ).not.toThrow();
  });

  it('de validación rechaza un status distinto de 400', () => {
    expect(() =>
      validarProblemDetails({ status: 404, errors: { Dni: ['x'] } }, 'validation'),
    ).toThrow(/status/);
  });
});

describe('omisión de endpoints en modo real', () => {
  const real = { objetivo: 'real', permitirEscrituras: false } as const;

  it('un endpoint destructivo se omite sin CONTRACT_ALLOW_WRITES', () => {
    expect(motivoOmision({ destructivo: true }, real)).toMatch(/CONTRACT_ALLOW_WRITES/);
    expect(motivoOmision({ destructivo: true }, { ...real, permitirEscrituras: true })).toBeNull();
  });

  it('un endpoint soloMock se omite', () => {
    expect(motivoOmision({ destructivo: false, soloMock: true }, real)).toMatch(/solo mock/);
  });

  it('en modo mock no se omite nada', () => {
    const mock = { objetivo: 'mock', permitirEscrituras: true } as const;

    expect(motivoOmision({ destructivo: true, soloMock: true }, mock)).toBeNull();
  });
});

describe('configuración', () => {
  it('en modo real sin VITE_API_BASE_URL falla y nombra la variable', () => {
    expect(() => leerConfiguracion({ CONTRACT_TARGET: 'real' })).toThrow(/VITE_API_BASE_URL/);
  });

  it('en modo real toma el origen sin barra final', () => {
    const configuracion = leerConfiguracion({
      CONTRACT_TARGET: 'real',
      VITE_API_BASE_URL: 'http://localhost:8080/',
    });

    expect(configuracion.baseUrl).toBe('http://localhost:8080');
    expect(configuracion.permitirEscrituras).toBe(false);
  });

  it('rechaza un CONTRACT_TARGET desconocido', () => {
    expect(() => leerConfiguracion({ CONTRACT_TARGET: 'otro' })).toThrow(/CONTRACT_TARGET/);
  });
});

describe.skipIf(esModoReal)('contra handlers de MSW', () => {
  it('un handler que cumple el contrato pasa', async () => {
    servidorMock.use(http.get(`*${RUTA}`, () => HttpResponse.json({ id: 'a', nombre: 'Plan' })));

    await expect(ejecutarExito(endpointDePrueba())).resolves.toBeUndefined();
  });

  it('un handler que devuelve forma incorrecta hace fallar el endpoint', async () => {
    servidorMock.use(http.get(`*${RUTA}`, () => HttpResponse.json({ id: 1 })));

    await expect(ejecutarExito(endpointDePrueba())).rejects.toThrow(/id/);
  });

  it('un status distinto del esperado hace fallar el endpoint', async () => {
    servidorMock.use(http.get(`*${RUTA}`, () => HttpResponse.json({}, { status: 500 })));

    await expect(ejecutarExito(endpointDePrueba())).rejects.toThrow(/Status 500/);
  });

  it('un error con text/html es un fallo, no un skip', async () => {
    servidorMock.use(
      http.get(
        `*${RUTA}`,
        () =>
          new HttpResponse('<html></html>', {
            status: 404,
            headers: { 'Content-Type': 'text/html' },
          }),
      ),
    );

    await expect(
      ejecutarError({
        nombre: 'no existe',
        estado: 404,
        esquema: 'problem',
        request: () => fetchContrato(RUTA),
      }),
    ).rejects.toThrow(/Content-Type/);
  });

  it('un error problem+json con la forma correcta pasa', async () => {
    servidorMock.use(
      http.get(`*${RUTA}`, () =>
        HttpResponse.json(
          { status: 404, detail: 'No existe.' },
          { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );

    await expect(
      ejecutarError({
        nombre: 'no existe',
        estado: 404,
        esquema: 'problem',
        request: () => fetchContrato(RUTA),
      }),
    ).resolves.toBeUndefined();
  });

  it('un 401 sin cuerpo se acepta (forma C)', async () => {
    servidorMock.use(http.get(`*${RUTA}`, () => new HttpResponse(null, { status: 401 })));

    await expect(
      ejecutarError({
        nombre: 'sin token',
        estado: 401,
        esquema: 'problem',
        request: () => fetchContrato(RUTA),
      }),
    ).resolves.toBeUndefined();
  });
});
