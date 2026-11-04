import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import {
  createApiClient,
  descargarBasePositiva,
  listarRendiciones,
  obtenerCuponEmpleado,
  pagoFacilKeys,
  subirRendicion,
} from '@nexa/api';
import { variantesPagoFacil as variantes } from '../../mocks/handlers/pagofacil';
import { servidorMock } from '../../mocks/server';

const baseUrl = 'https://api.test';
const cliente = createApiClient({ baseUrl, getToken: () => 'mock-empleado' });
const anonimo = createApiClient({ baseUrl });
const archivo = new File(['rendición de prueba'], 'rendicion.txt', { type: 'text/plain' });
const cuotaId = 'f1000000-0000-0000-0000-000000000001';
const rendiciones = '*/api/pagofacil/rendiciones';
const basePositiva = '*/api/pagofacil/base-positiva';

beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
afterEach(() => servidorMock.resetHandlers());
afterAll(() => servidorMock.close());

it('recibe 201 y devuelve el resumen completo sin rechazos', async () => {
  const body = new FormData();
  body.append('archivo', archivo);
  const respuesta = await cliente.post('/api/pagofacil/rendiciones', body, { responseType: 'raw' });
  expect(respuesta.status).toBe(201);
  await expect(subirRendicion(cliente, archivo)).resolves.toMatchObject({
    nombreArchivo: archivo.name,
    cantidadRegistros: 3,
    procesadas: 3,
    rechazadas: 0,
    errores: [],
  });
});

it('devuelve los rechazos de línea como resultado parcial', async () => {
  servidorMock.use(variantes.rendicionConRechazos);
  await expect(subirRendicion(cliente, archivo)).resolves.toMatchObject({
    procesadas: 1,
    rechazadas: 2,
    errores: [
      { linea: 2, motivo: expect.any(String) },
      { linea: 3, motivo: expect.any(String) },
    ],
  });
});

it('manda el archivo original en multipart con boundary', async () => {
  servidorMock.use(
    http.post(rendiciones, async ({ request }) => {
      expect(request.headers.get('content-type')).toMatch(/^multipart\/form-data; boundary=/);
      const campo = (await request.formData()).get('archivo');
      if (!campo || typeof campo === 'string') throw new Error('Falta el archivo multipart');
      expect(campo.name).toBe(archivo.name);
      expect(await campo.text()).toBe(await archivo.text());
      return HttpResponse.json({ nombreArchivo: campo.name }, { status: 201 });
    }),
  );
  await expect(subirRendicion(cliente, archivo)).resolves.toMatchObject({
    nombreArchivo: archivo.name,
  });
});

it.each([
  [
    variantes.rendicionNombreInvalido,
    "El nombre del archivo debe tener entre 1 y 90 caracteres: letras sin acento, dígitos, '.', '-' o '_'.",
  ],
  [variantes.rendicionSuperaTamano, 'El archivo supera el máximo de 5 MB.'],
  [variantes.rendicionVacia, 'El archivo de rendición está vacío.'],
  [
    variantes.rendicionYaProcesada(archivo.name),
    'El archivo rendicion.txt ya fue procesado (RN18).',
  ],
  [
    variantes.rendicionLineasMalFormadas,
    'El archivo de rendición tiene líneas mal formadas: línea 1: La línea tiene 59 caracteres y deben ser 60.; línea 2: La línea solo puede tener dígitos.',
  ],
] as const)('preserva el detalle de rendición: %s', async (handler, detail) => {
  servidorMock.use(handler);
  await expect(subirRendicion(cliente, archivo)).rejects.toMatchObject({ status: 400, detail });
});

it('devuelve validación por campo cuando falta archivo', async () => {
  await expect(cliente.post('/api/pagofacil/rendiciones', new FormData())).rejects.toMatchObject({
    status: 400,
    errors: { archivo: expect.any(Array) },
  });
});

it.each([
  [variantes.rendicionTransporte413, 413, null],
  [variantes.rendicionFallaInesperada, 500, 'Ocurrió un error inesperado.'],
] as const)('propaga el status de transporte o falla: %s', async (handler, status, detail) => {
  servidorMock.use(handler);
  await expect(subirRendicion(cliente, archivo)).rejects.toMatchObject({ status, detail });
});

it('no reenvía la rendición ante un 502', async () => {
  let intentos = 0;
  servidorMock.use(
    http.post(rendiciones, () => {
      intentos++;
      return new HttpResponse(null, { status: 502 });
    }),
  );
  await expect(subirRendicion(cliente, archivo)).rejects.toMatchObject({ status: 502 });
  expect(intentos).toBe(1);
});

it('devuelve el historial con fecha de proceso', async () => {
  await expect(listarRendiciones(cliente)).resolves.toEqual([
    expect.objectContaining({
      fechaRendicion: '2026-11-20',
      fechaProceso: '2026-11-20T12:00:00Z',
      pagosAprobados: 3,
    }),
  ]);
  expect(pagoFacilKeys.rendiciones()).toEqual(['pagoFacil', 'rendiciones']);
});

it('deriva el nombre de H y preserva registros y saltos de línea', async () => {
  const { nombreArchivo, contenido } = await descargarBasePositiva(cliente);
  expect(nombreArchivo).toBe('BASEPOS_12345_20261120.txt');
  const registros = contenido.split('\r\n');
  expect(registros.map((registro) => registro[0])).toEqual(['H', 'D', 'T', undefined]);
  expect(registros.map((registro) => registro.length)).toEqual([97, 97, 97, 0]);
});

it('rechaza JSON con 200 y texto plano sin registro H', async () => {
  servidorMock.use(variantes.basePositivaJsonConTextPlain);
  await expect(descargarBasePositiva(cliente)).rejects.toMatchObject({
    kind: 'respuesta-invalida',
    status: 200,
  });
  servidorMock.use(http.get(basePositiva, () => HttpResponse.text('sin encabezado')));
  await expect(descargarBasePositiva(cliente)).rejects.toMatchObject({
    kind: 'respuesta-invalida',
    status: 200,
  });
});

it.each([
  [
    variantes.basePositivaDesborde,
    400,
    'El importe 100000.00 no entra en el código de Pago Fácil.',
  ],
  [variantes.basePositivaFallaInesperada, 500, 'Ocurrió un error inesperado.'],
  [variantes.basePositivaSinToken, 401, null],
] as const)('conserva el error de descarga: %s', async (handler, status, detail) => {
  servidorMock.use(handler);
  await expect(descargarBasePositiva(cliente)).rejects.toMatchObject({ status, detail });
});

it('devuelve el cupón del id solicitado con código de 42 dígitos', async () => {
  await expect(obtenerCuponEmpleado(cliente, cuotaId)).resolves.toMatchObject({
    cuotaId,
    numeroPoliza: 'POL-0000001',
    codigoBarras: expect.stringMatching(/^\d{42}$/),
  });
  expect(pagoFacilKeys.cuponEmpleado(cuotaId)).toEqual(['pagoFacil', 'cuponEmpleado', cuotaId]);
});

it.each([
  [
    variantes.cuponCuotaPagada,
    400,
    'No se puede generar el cupón de una cuota en estado Pagada (RN11).',
  ],
  [
    variantes.cuponCuotaAnulada,
    400,
    'No se puede generar el cupón de una cuota en estado Anulada (RN11).',
  ],
  [variantes.cuotaNoExiste, 404, 'La cuota no existe.'],
  [variantes.polizaNoExiste, 404, 'La póliza de la cuota no existe.'],
  [variantes.cuponDesborde, 400, 'El importe 100000.00 no entra en el código de Pago Fácil.'],
  [variantes.cuponPolizaInvalida, 400, 'El número de póliza INVALIDO no tiene un formato válido.'],
  [variantes.cuponFallaInesperada, 500, 'Ocurrió un error inesperado.'],
] as const)('conserva el error de cupón: %s', async (handler, status, detail) => {
  servidorMock.use(handler);
  await expect(obtenerCuponEmpleado(cliente, cuotaId)).rejects.toMatchObject({ status, detail });
});

it.each([
  (api: typeof cliente) => subirRendicion(api, archivo),
  listarRendiciones,
  descargarBasePositiva,
  (api: typeof cliente) => obtenerCuponEmpleado(api, cuotaId),
])('propaga 401 y 403 en operaciones protegidas', async (operacion) => {
  await expect(operacion(anonimo)).rejects.toMatchObject({ status: 401 });
  servidorMock.use(variantes.sinPermiso);
  await expect(operacion(cliente)).rejects.toMatchObject({ status: 403 });
});
