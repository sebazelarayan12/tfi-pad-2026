import { http, HttpResponse } from 'msw';
import type { VehiculoResponse, VehiculoDnrpaPreviewMock } from '../../src/dto/vehiculos';
import { clientesFixture, CLIENTE_INACTIVO_ID } from '../fixtures/clientes';
import {
  problemaNegocio,
  problemaNoEncontrado,
  problemaValidacion,
  problemaSinSesion,
} from '../fixtures/comunes';
import { crearEstadoVehiculos, dnrpaFixture, esGuid, GUID_VACIO } from '../fixtures/vehiculos';
import { autorizar, leerCuerpo, responderProblema, variante } from './soporte-vehiculos';

const ruta = '*/api/vehiculos';
const obligatorio = {
  status: 400,
  title: 'Solicitud inválida',
  detail: "El parámetro 'clienteId' es obligatorio.",
};
const formato = (patente: string) =>
  `La patente '${patente}' no tiene un formato válido (AA000AA o AAA000).`;
const duplicado = (patente: string) =>
  `Ya existe un vehículo registrado con la patente '${patente}' (RN03).`;
const desconocido = (patente: string) =>
  `VEHICULO_NO_ENCONTRADO: La patente '${patente}' no figura en el registro de DNRPA.`;
const noExiste = (id: string) => problemaNoEncontrado(`El vehículo ${id} no existe.`);

/** Cada fábrica recibe su estado aislado; los handlers por defecto lo comparten con cotizaciones. */
export function crearHandlersVehiculos(registros: VehiculoResponse[] = crearEstadoVehiculos()) {
  return [
    http.get(ruta, ({ request }) => {
      const error = autorizar(request);
      if (error) return error;
      const id = new URL(request.url).searchParams.get('clienteId');
      if (!id || id === GUID_VACIO) return responderProblema(request, obligatorio);
      if (!esGuid(id))
        return responderProblema(
          request,
          problemaValidacion({ clienteId: ['The value is not valid.'] }),
        );
      return HttpResponse.json(
        registros
          .filter((v) => v.clienteId === id.toLowerCase() && v.activo)
          .sort((a, b) => a.patente.localeCompare(b.patente)),
      );
    }),
    // SOLO MOCK (PB-23): se registra antes de la ruta dinámica; nunca expone el DNI completo.
    http.get(`${ruta}/dnrpa/:patente`, ({ request, params }) => {
      const error = autorizar(request);
      if (error) return error;
      const dato = dnrpaFixture.find(
        (v) => v.patente === String(params.patente).trim().toUpperCase(),
      );
      if (!dato)
        return responderProblema(request, problemaNegocio(desconocido(String(params.patente))));
      const vista: VehiculoDnrpaPreviewMock = {
        patente: dato.patente,
        marca: dato.marca,
        modelo: dato.modelo,
        anio: dato.anio,
        tipo: dato.tipo,
        titularDniEnmascarado: `***.${dato.dni.slice(-3)}`,
        coincideConCliente: null,
      };
      return HttpResponse.json(vista);
    }),
    http.get(`${ruta}/:id`, ({ request, params }) => {
      const error = autorizar(request);
      if (error) return error;
      const id = String(params.id).toLowerCase();
      if (!esGuid(id)) return new HttpResponse(null, { status: 404 });
      const vehiculo = registros.find((v) => v.id === id);
      return vehiculo ? HttpResponse.json(vehiculo) : responderProblema(request, noExiste(id));
    }),
    http.post(ruta, async ({ request }) => {
      const error = autorizar(request);
      if (error) return error;
      const cuerpo = await leerCuerpo(request);
      const errors: Record<string, string[]> = {};
      if (typeof cuerpo.patente !== 'string' || !cuerpo.patente.trim())
        errors.Patente = ['The Patente field is required.'];
      if (cuerpo.uso == null) errors.Uso = ['The Uso field is required.'];
      else if (typeof cuerpo.uso !== 'number' || !Number.isInteger(cuerpo.uso))
        errors.Uso = ['The JSON value could not be converted.'];
      const clienteId = cuerpo.clienteId ?? GUID_VACIO;
      if (!esGuid(clienteId)) errors.ClienteId = ['The JSON value could not be converted.'];
      if (Object.keys(errors).length) return responderProblema(request, problemaValidacion(errors));
      const patente = String(cuerpo.patente).trim().toUpperCase();
      let detail: string | undefined;
      if (!/^([A-Z]{2}[0-9]{3}[A-Z]{2}|[A-Z]{3}[0-9]{3})$/.test(patente)) detail = formato(patente);
      else if (cuerpo.uso !== 0 && cuerpo.uso !== 1)
        detail = 'El uso del vehículo es obligatorio y debe ser válido.';
      if (detail) return responderProblema(request, problemaNegocio(detail));
      const cliente = clientesFixture.find(
        (v) => v.cliente.id === String(clienteId).toLowerCase(),
      )?.cliente;
      if (!cliente)
        return responderProblema(
          request,
          problemaNoEncontrado(`El cliente ${clienteId} no existe.`),
        );
      if (!cliente.activo)
        return responderProblema(
          request,
          problemaNegocio(`El cliente ${clienteId} está dado de baja.`),
        );
      if (registros.some((v) => v.patente === patente))
        return responderProblema(request, problemaNegocio(duplicado(patente)));
      const dato = dnrpaFixture.find((v) => v.patente === patente);
      if (!dato) return responderProblema(request, problemaNegocio(desconocido(patente)));
      if (dato.dni !== cliente.dni)
        return responderProblema(
          request,
          problemaNegocio(
            `RN03: El titular registral en DNRPA (DNI ${dato.dni}) no coincide con el DNI del cliente (${cliente.dni}).`,
          ),
        );
      const creado: VehiculoResponse = {
        id: crypto.randomUUID(),
        clienteId: cliente.id,
        patente,
        marca: dato.marca,
        modelo: dato.modelo,
        anio: dato.anio,
        tipo: dato.tipo,
        uso: cuerpo.uso as 0 | 1,
        validadoDnrpa: true,
        activo: true,
      };
      registros.push(creado);
      return HttpResponse.json(creado, {
        status: 201,
        headers: { Location: `/api/vehiculos/${creado.id}` },
      });
    }),
  ];
}

/** Variantes explícitas para sobreescribir con server.use sin alterar los datos base. */
export const variantesVehiculos = {
  vehiculosClienteSinClienteId: variante('get', ruta, obligatorio),
  vehiculosClienteInexistente: http.get(
    ruta,
    ({ request }) => autorizar(request) ?? HttpResponse.json([]),
  ),
  vehiculoNoExiste: variante('get', `${ruta}/:id`, noExiste(GUID_VACIO)),
  sinToken: variante('get', ruta, problemaSinSesion()),
  altaFormatoInvalido: variante('post', ruta, problemaNegocio(formato('AB12CDE'))),
  altaUsoInvalido: variante(
    'post',
    ruta,
    problemaNegocio('El uso del vehículo es obligatorio y debe ser válido.'),
  ),
  altaClienteBaja: variante(
    'post',
    ruta,
    problemaNegocio(`El cliente ${CLIENTE_INACTIVO_ID} está dado de baja.`),
  ),
  altaDuplicada: variante('post', ruta, problemaNegocio(duplicado('AB123CD'))),
  altaDnrpaDesconocido: variante('post', ruta, problemaNegocio(desconocido('ZZ999ZZ'))),
  altaTitularDistinto: variante(
    'post',
    ruta,
    problemaNegocio(
      'RN03: El titular registral en DNRPA (DNI 27111222) no coincide con el DNI del cliente (30123456).',
    ),
  ),
  altaClienteNoExiste: variante(
    'post',
    ruta,
    problemaNoEncontrado(`El cliente ${GUID_VACIO} no existe.`),
  ),
  altaValidacion: variante(
    'post',
    ruta,
    problemaValidacion({ Patente: ['The Patente field is required.'] }),
  ),
  altaDnrpaCaido: variante('post', ruta, {
    status: 502,
    title: 'Bad Gateway',
    detail: 'DNRPA no disponible temporalmente.',
  }),
};

export const estadoVehiculos = crearEstadoVehiculos();
export const handlers = crearHandlersVehiculos(estadoVehiculos);
