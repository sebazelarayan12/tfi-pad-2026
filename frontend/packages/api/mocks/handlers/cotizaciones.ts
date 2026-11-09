import { http, HttpResponse } from 'msw';
import type {
  CotizacionDto,
  CotizacionListItemResponse,
  OpcionCotizacionMock,
} from '../../src/dto/cotizaciones';
import type { VehiculoResponse } from '../../src/dto/vehiculos';
import { CLIENTE_JUAN_ID, clientesFixture } from '../fixtures/clientes';
import {
  problemaNegocio,
  problemaNoEncontrado,
  problemaSinSesion,
  problemaValidacion,
} from '../fixtures/comunes';
import {
  COTIZACION_ID,
  crearEstadoVehiculos,
  esGuid,
  GUID_VACIO,
  VEHICULO_ID,
  VEHICULO_BAJA_ID,
} from '../fixtures/vehiculos';
import { autorizar, leerCuerpo, responderProblema, variante } from './soporte-vehiculos';
import { estadoVehiculos } from './vehiculos';

const ruta = '*/api/cotizaciones';

/** Filas fijas del listado; el handler solo las filtra y pagina. */
const listadoCotizaciones: CotizacionListItemResponse[] = [
  {
    id: 'd3000000-0000-0000-0000-000000000003',
    planId: 'a1000000-0000-0000-0000-000000000002',
    codigoPlan: 'TC',
    nombrePlan: 'Terceros Completo',
    clienteId: CLIENTE_JUAN_ID,
    clienteNombre: 'Juan Carlos Pérez',
    vehiculoId: VEHICULO_ID,
    patente: 'AB123CD',
    primaMensual: 18000,
    fechaCotizacion: '2026-11-08T15:00:00Z',
    fechaVencimiento: '2026-11-23T15:00:00Z',
    vigente: true,
    origen: 1,
  },
  {
    id: 'd3000000-0000-0000-0000-000000000002',
    planId: 'a1000000-0000-0000-0000-000000000001',
    codigoPlan: 'RC',
    nombrePlan: 'Responsabilidad Civil',
    clienteId: null,
    clienteNombre: null,
    vehiculoId: null,
    patente: null,
    primaMensual: 12000,
    fechaCotizacion: '2026-11-02T11:42:14Z',
    fechaVencimiento: '2026-11-17T11:42:14Z',
    vigente: true,
    origen: 2,
  },
  {
    id: 'd3000000-0000-0000-0000-000000000001',
    planId: 'a1000000-0000-0000-0000-000000000001',
    codigoPlan: 'RC',
    nombrePlan: 'Responsabilidad Civil',
    clienteId: CLIENTE_JUAN_ID,
    clienteNombre: 'Juan Carlos Pérez',
    vehiculoId: VEHICULO_ID,
    patente: 'AB123CD',
    primaMensual: 12000,
    fechaCotizacion: '2026-10-01T10:00:00Z',
    fechaVencimiento: '2026-10-16T10:00:00Z',
    vigente: false,
    origen: 1,
  },
];
const planes = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    codigo: 'RC',
    nombre: 'Responsabilidad Civil',
    prima: 12000,
  },
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    codigo: 'TC',
    nombre: 'Terceros Completo',
    prima: 18000,
  },
  { id: 'a1000000-0000-0000-0000-000000000003', codigo: 'TR', nombre: 'Todo Riesgo', prima: 30000 },
] as const;
const noExiste = (id: string) => problemaNoEncontrado(`La cotización ${id} no existe.`);
const sinPlanes = problemaNegocio('Ningún plan es compatible con el vehículo.');

// SOLO MOCK: respuestas precalculadas de los vehículos DNRPA del contrato para 2026.
// No reemplazan el motor del back ni calculan edad/antigüedad desde el reloj del navegador.
const perfiles = [
  {
    factorTipo: 1,
    primas: [
      [12000, 18000, 30000],
      [16800, 25200, 42000],
    ],
  },
  {
    factorTipo: 0.7,
    primas: [
      [8400, 12600],
      [11760, 17640],
    ],
  },
  {
    factorTipo: 1.2,
    primas: [
      [14400, 21600, 36000],
      [20160, 30240, 50400],
    ],
  },
] as const;

/** Estado por fábrica; el reloj se inyecta para probar los 15 días sin fechas vencidas. */
export function crearHandlersCotizaciones(
  vehiculos: VehiculoResponse[] = crearEstadoVehiculos(),
  ahora = () => new Date(),
) {
  const fecha = ahora();
  const vencimiento = new Date(fecha.getTime() + 15 * 86400000).toISOString();
  const registros = new Map<string, CotizacionDto>([
    [
      COTIZACION_ID,
      {
        id: COTIZACION_ID,
        planId: planes[1].id,
        codigoPlan: 'TC',
        clienteId: CLIENTE_JUAN_ID,
        vehiculoId: VEHICULO_ID,
        primaMensual: 18000,
        fechaCotizacion: fecha.toISOString().replace(/Z$/, ''),
        fechaVencimiento: vencimiento,
        origen: 1,
      },
    ],
  ]);
  return [
    http.post(ruta, async ({ request }) => {
      const error = autorizar(request);
      if (error) return error;
      const cuerpo = await leerCuerpo(request);
      if (!esGuid(cuerpo.vehiculoId))
        return responderProblema(
          request,
          problemaValidacion({
            VehiculoId: ['The VehiculoId field is required and must be a Guid.'],
          }),
        );
      const id = cuerpo.vehiculoId.toLowerCase();
      const vehiculo = vehiculos.find((v) => v.id === id);
      if (!vehiculo)
        return responderProblema(request, problemaNoEncontrado(`El vehículo ${id} no existe.`));
      if (!vehiculo.activo)
        return responderProblema(
          request,
          problemaNegocio(`El vehículo ${id} está dado de baja y no se puede cotizar.`),
        );
      if (!clientesFixture.some((v) => v.cliente.id === vehiculo.clienteId))
        return responderProblema(
          request,
          problemaNoEncontrado(`El cliente ${vehiculo.clienteId} del vehículo no existe.`),
        );
      const fechaCotizacion = ahora().toISOString();
      const fechaVencimiento = new Date(
        new Date(fechaCotizacion).getTime() + 15 * 86400000,
      ).toISOString();
      // SOLO MOCK (PB-10): la UI solo muestra este desglose si está disponible.
      const perfil = perfiles[vehiculo.tipo];
      const primas = perfil.primas[vehiculo.uso];
      const opciones: OpcionCotizacionMock[] = planes
        .slice(0, primas.length)
        .map((plan, indice) => {
          const idCotizacion = crypto.randomUUID();
          const primaMensual = primas[indice]!;
          registros.set(idCotizacion, {
            id: idCotizacion,
            planId: plan.id,
            codigoPlan: plan.codigo,
            clienteId: vehiculo.clienteId,
            vehiculoId: id,
            primaMensual,
            fechaCotizacion,
            fechaVencimiento,
            origen: 1,
          });
          return {
            idCotizacion,
            codigoPlan: plan.codigo,
            plan: plan.nombre,
            primaMensual,
            calculo: {
              primaBase: plan.prima,
              factorTipo: perfil.factorTipo,
              factorAntiguedad: 1,
              factorEdad: 1,
              factorUso: vehiculo.uso === 0 ? 1 : 1.4,
            },
          };
        });
      return HttpResponse.json({ fechaVencimiento, opciones }, { status: 201 });
    }),
    http.get(ruta, ({ request }) => {
      const error = autorizar(request);
      if (error) return error;
      const url = new URL(request.url);
      const vigente = url.searchParams.get('vigente');
      const pagina = Math.max(Number(url.searchParams.get('pagina')) || 1, 1);
      const tamano = Math.min(Math.max(Number(url.searchParams.get('tamano')) || 20, 1), 100);
      const filtradas = listadoCotizaciones.filter(
        (cotizacion) => vigente === null || String(cotizacion.vigente) === vigente,
      );
      const inicio = (pagina - 1) * tamano;
      return HttpResponse.json({
        items: filtradas.slice(inicio, inicio + tamano),
        pagina,
        tamanoPagina: tamano,
        total: filtradas.length,
      });
    }),
    http.get(`${ruta}/:id`, ({ request, params }) => {
      const error = autorizar(request);
      if (error) return error;
      const id = String(params.id).toLowerCase();
      if (!esGuid(id)) return new HttpResponse(null, { status: 404 });
      const cotizacion = registros.get(id);
      return cotizacion ? HttpResponse.json(cotizacion) : responderProblema(request, noExiste(id));
    }),
  ];
}

export const variantesCotizaciones = {
  sinToken: variante('post', ruta, problemaSinSesion()),
  cotizarSinPlanes: variante('post', ruta, sinPlanes),
  cotizarVehiculoDadoDeBaja: variante(
    'post',
    ruta,
    problemaNegocio(`El vehículo ${VEHICULO_BAJA_ID} está dado de baja y no se puede cotizar.`),
  ),
  cotizarVehiculoNoExiste: variante(
    'post',
    ruta,
    problemaNoEncontrado(`El vehículo ${GUID_VACIO} no existe.`),
  ),
  cotizarClienteNoExiste: variante(
    'post',
    ruta,
    problemaNoEncontrado(`El cliente ${GUID_VACIO} del vehículo no existe.`),
  ),
  cotizarValidacion: variante(
    'post',
    ruta,
    problemaValidacion({ VehiculoId: ['The VehiculoId field is required.'] }),
  ),
  cotizacionNoExiste: variante('get', `${ruta}/:id`, noExiste(GUID_VACIO)),
  cotizacionPlanNoExiste: variante(
    'get',
    `${ruta}/:id`,
    problemaNoEncontrado(`El plan ${GUID_VACIO} de la cotización ${COTIZACION_ID} no existe.`),
  ),
};

export const handlers = crearHandlersCotizaciones(estadoVehiculos);
