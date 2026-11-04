import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  actualizarPlan,
  crearPlan,
  createApiClient,
  desactivarPlan,
  listarPlanes,
  listarPlanesIncluyendoInactivos,
  obtenerPlan,
  PLANES_INACTIVOS_DISPONIBLES,
  planesKeys,
  reactivarPlan,
  type PlanRequest,
} from '@nexa/api';
import {
  crearHandlersPlanes,
  planDescripcionObligatoria,
  planesError500,
  planNombreObligatorio,
  tokensMockPlanes,
} from '../../mocks/handlers/planes';
import { servidorMock } from '../../mocks/server';

const baseUrl = 'https://api.test';
const cliente = createApiClient({ baseUrl });
const admin = createApiClient({ baseUrl, getToken: () => tokensMockPlanes.administrador });
const empleado = createApiClient({ baseUrl, getToken: () => tokensMockPlanes.empleado });
const idRc = 'a1000000-0000-0000-0000-000000000001';
const idTr = 'a1000000-0000-0000-0000-000000000003';
const idInexistente = 'a1000000-0000-0000-0000-000000000099';
const plan: PlanRequest = {
  codigo: 'nuevo',
  nombre: 'Nuevo plan',
  descripcion: 'Cobertura de prueba',
  primaBase: 1000.125,
  tiposPermitidos: 'auto, Camioneta, Auto',
};

beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => servidorMock.use(...crearHandlersPlanes()));
afterEach(() => servidorMock.resetHandlers());
afterAll(() => servidorMock.close());

describe('lectura pública', () => {
  it('devuelve RC, TC y TR activos y ordenados', async () => {
    const planes = await listarPlanes(cliente);
    expect(planes.map(({ codigo }) => codigo)).toEqual(['RC', 'TC', 'TR']);
    expect(planes.every(({ activo }) => activo)).toBe(true);
  });

  it('no envía Authorization con un cliente público', async () => {
    const autorizaciones: Array<string | null> = [];
    servidorMock.use(
      http.get('*/api/planes', ({ request }) => {
        autorizaciones.push(request.headers.get('Authorization'));
        return HttpResponse.json([]);
      }),
    );
    await listarPlanes(cliente);
    expect(autorizaciones).toEqual([null]);
  });

  it('devuelve el detalle de TR', async () => {
    await expect(obtenerPlan(cliente, idTr)).resolves.toMatchObject({
      id: idTr,
      codigo: 'TR',
      antiguedadMaxima: 10,
      tiposPermitidos: 'Auto,Camioneta',
    });
  });

  it('devuelve el mismo 404 para un plan inactivo o inexistente', async () => {
    await desactivarPlan(admin, idRc);
    for (const id of [idRc, idInexistente]) {
      await expect(obtenerPlan(cliente, id)).rejects.toMatchObject({
        status: 404,
        detail: `El plan ${id} no existe o no está activo.`,
      });
    }
  });

  it('propaga el 500 del listado', async () => {
    servidorMock.use(planesError500);
    await expect(listarPlanes(cliente)).rejects.toMatchObject({
      status: 500,
      detail: 'Ocurrió un error inesperado.',
    });
  });
});

describe('escritura de planes', () => {
  it.each([
    [planNombreObligatorio, 'El nombre del plan es obligatorio.'],
    [planDescripcionObligatoria, 'La descripción del plan es obligatoria.'],
  ] as const)('propaga la variante de negocio %j', async (handler, detail) => {
    servidorMock.use(handler);
    await expect(crearPlan(admin, plan)).rejects.toMatchObject({
      status: 400,
      detail,
      errors: null,
    });
  });

  it('crea con 201 y normaliza código, prima y tipos', async () => {
    const respuesta = await admin.post('/api/planes', plan, { responseType: 'raw' });
    expect(respuesta.status).toBe(201);
    expect(JSON.parse(respuesta.texto)).toMatchObject({
      codigo: 'NUEVO',
      primaBase: 1000.13,
      tiposPermitidos: 'Auto,Camioneta',
      activo: true,
    });
    await expect(listarPlanes(cliente)).resolves.toHaveLength(4);
  });

  it.each([
    [{ codigo: '' }, 'Codigo'],
    [{ nombre: 'x'.repeat(81) }, 'Nombre'],
    [{ descripcion: 'x'.repeat(501) }, 'Descripcion'],
    [{ tiposPermitidos: 'x'.repeat(51) }, 'TiposPermitidos'],
  ] as const)('devuelve errores de validación en PascalCase para %j', async (datos, clave) => {
    await expect(crearPlan(admin, { ...plan, ...datos })).rejects.toMatchObject({
      status: 400,
      errors: { [clave]: expect.any(Array) },
    });
  });

  it.each([
    [{ primaBase: 0 }, 'La prima base debe ser mayor que cero.'],
    [{ antiguedadMaxima: -1 }, 'La antigüedad máxima debe ser mayor o igual a cero.'],
    [{ tiposPermitidos: ', ,' }, 'Debe indicar al menos un tipo de vehículo permitido.'],
    [{ tiposPermitidos: 'Avión' }, "El tipo de vehículo 'Avión' no es válido."],
    [{ codigo: 'rc' }, "Ya existe un plan con el código 'RC'."],
  ] as const)('devuelve el error de negocio para %j', async (datos, detail) => {
    await expect(crearPlan(admin, { ...plan, ...datos })).rejects.toMatchObject({
      status: 400,
      detail,
      errors: null,
    });
  });

  it('edita un plan inactivo y lo conserva inactivo', async () => {
    await desactivarPlan(admin, idRc);
    await expect(actualizarPlan(admin, idRc, plan)).resolves.toMatchObject({
      id: idRc,
      codigo: 'NUEVO',
      activo: false,
    });
  });

  it('rechaza el código de otro plan en edición', async () => {
    await expect(actualizarPlan(admin, idRc, { ...plan, codigo: 'tr' })).rejects.toMatchObject({
      status: 400,
      detail: "Ya existe otro plan con el código 'TR'.",
    });
  });

  it('desactiva con 204 sin cuerpo y admite repetirlo', async () => {
    const respuesta = await admin.delete(`/api/planes/${idRc}`, undefined, { responseType: 'raw' });
    expect(respuesta).toMatchObject({ status: 204, texto: '' });
    await expect(desactivarPlan(admin, idRc)).resolves.toBeUndefined();
  });

  it.each([
    (api: typeof cliente) => actualizarPlan(api, idInexistente, plan),
    (api: typeof cliente) => desactivarPlan(api, idInexistente),
  ])('devuelve 404 al modificar un plan inexistente', async (operacion) => {
    await expect(operacion(admin)).rejects.toMatchObject({
      status: 404,
      detail: `El plan ${idInexistente} no existe.`,
    });
  });

  it.each([
    (api: typeof cliente) => crearPlan(api, plan),
    (api: typeof cliente) => actualizarPlan(api, idRc, plan),
    (api: typeof cliente) => desactivarPlan(api, idRc),
  ])('exige credenciales de administrador', async (operacion) => {
    await expect(operacion(cliente)).rejects.toMatchObject({ status: 401 });
    await expect(operacion(empleado)).rejects.toMatchObject({ status: 403 });
  });

  it('no reintenta una mutación ante un 500', async () => {
    let llamadas = 0;
    servidorMock.use(
      http.post('*/api/planes', () => {
        llamadas++;
        return new HttpResponse(null, { status: 500 });
      }),
    );
    await expect(crearPlan(admin, plan)).rejects.toMatchObject({ status: 500 });
    expect(llamadas).toBe(1);
  });
});

it('separa la caché y mantiene PB-09 disponible solo como simulación', async () => {
  expect(PLANES_INACTIVOS_DISPONIBLES).toBe(false);
  expect(planesKeys.lista({})).not.toEqual(planesKeys.lista({ incluirInactivos: true }));
  expect(planesKeys.detalle(idRc)).toEqual(['planes', 'detalle', idRc]);
  await desactivarPlan(admin, idRc);
  expect((await listarPlanes(cliente)).map(({ codigo }) => codigo)).toEqual(['TC', 'TR']);
  await expect(listarPlanesIncluyendoInactivos(admin)).resolves.toContainEqual(
    expect.objectContaining({ id: idRc, activo: false }),
  );
  await expect(reactivarPlan(admin, idRc, true)).resolves.toMatchObject({ id: idRc, activo: true });
});
