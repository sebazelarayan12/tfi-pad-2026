import { http, HttpResponse } from 'msw';
import type { ProblemDetails } from '../../src/dto/comunes';
import type {
  ConsultaEstadoPagoRequest,
  ConsultaPublicaRequest,
  ConsultaPublicaResponse,
  CuponPublicoRespuestaMock,
  EstadoPagoPublico,
  FacturaResponse,
  MedioPagoPublicoMock,
  PagoPublicoRequest,
  PagoPublicoResponse,
  PublicoFacturaRequest,
} from '../../src/dto/publico';
import {
  problemaErrorInesperado,
  problemaNegocio,
  problemaNoEncontrado,
  problemaRateLimit,
  problemaValidacion,
} from '../fixtures/comunes';

const ruta = '*/api/publico';
const consulta = `${ruta}/consulta`;
const pagos = `${ruta}/pagos`;
const estadoPago = `${ruta}/pagos/estado`;
const factura = `${ruta}/factura`;
const cupon = `${ruta}/cupon`;
const mediosPago = `${ruta}/medios-pago`;

const mensajeNoEncontrado = 'No se encontró un registro con los datos indicados.';
const regexDni = /^\d{8}$/;
const regexPoliza = /^POL-\d{7}$/;
const codigoBarras = '123450120000020261210000000100112600001026';
const traceId = '00-00000000000000000000000000000001-0000000000000001-01';

const consultaVigente: ConsultaPublicaResponse = {
  numeroPoliza: 'POL-0000001',
  estado: 'VIGENTE',
  coberturaVigente: true,
  vigenteDesde: '2026-10-15',
  vigenteHasta: '2027-04-15',
  plan: { codigo: 'RC', nombre: 'Responsabilidad Civil' },
  vehiculo: { patente: 'AB123CD', marca: 'Toyota', modelo: 'Corolla XEi', anio: 2021 },
  cuotas: [
    {
      idCuota: 'f1000000-0000-0000-0000-000000000001',
      numero: 1,
      importe: 12000,
      recargo: 0,
      total: 12000,
      vencimiento: '2026-11-10',
      estado: 'PAGADA',
    },
    {
      idCuota: 'f1000000-0000-0000-0000-000000000002',
      numero: 2,
      importe: 12000,
      recargo: 0,
      total: 12000,
      vencimiento: '2026-12-10',
      estado: 'PENDIENTE',
    },
    {
      idCuota: 'f1000000-0000-0000-0000-000000000003',
      numero: 3,
      importe: 12000,
      recargo: 0,
      total: 12000,
      vencimiento: '2027-01-10',
      estado: 'PENDIENTE',
    },
  ],
};

const pagoCreado: PagoPublicoResponse = {
  numeroPago: 'PAG-6f1c2a',
  idPago: 'f3000000-0000-0000-0000-000000000001',
  urlPago: 'https://pasarela1.example/checkout/PSR-PAG-6f1c2a',
  fechaExpiracion: '2026-10-30T21:00:00Z',
};

const facturaAutorizada: FacturaResponse = {
  id: 'f4000000-0000-0000-0000-000000000001',
  pagoId: 'f3000000-0000-0000-0000-000000000001',
  numero: '0001-00000001',
  tipo: 'B',
  importe: 12000,
  estado: 'AUTORIZADA',
  cae: '12345678901234',
  vencimientoCae: '2026-11-20',
  fechaEmision: '2026-10-30T20:55:00Z',
};

const facturaPendienteCae: FacturaResponse = {
  ...facturaAutorizada,
  id: 'f4000000-0000-0000-0000-000000000002',
  numero: '',
  estado: 'PENDIENTE_CAE',
  cae: null,
  vencimientoCae: null,
};

/** MOCK (PB-02): respuesta de cupón público; `totalCuotas` null hasta PB-02 (D-31-4). */
const cuponMock: CuponPublicoRespuestaMock = {
  cuotaId: 'f1000000-0000-0000-0000-000000000002',
  numeroPoliza: 'POL-0000001',
  numeroCuota: 2,
  importePrimerVencimiento: 12000,
  fechaPrimerVencimiento: '2026-12-10',
  importeSegundoVencimiento: 12600,
  fechaSegundoVencimiento: '2026-12-20',
  codigoBarras,
  totalCuotas: null,
};

/** Pago aprobado con factura (PB-01). */
const estadoAprobado: EstadoPagoPublico = {
  numeroPago: 'PAG-6f1c2a',
  estado: 'APROBADO',
  fechaAcreditacion: '2026-10-30T20:55:00Z',
  urlPago: null,
  factura: facturaAutorizada,
};

const estadoPendiente: EstadoPagoPublico = {
  numeroPago: 'PAG-6f1c2a',
  estado: 'PENDIENTE',
  fechaAcreditacion: null,
  urlPago: pagoCreado.urlPago,
  factura: null,
};

const estadoRechazado: EstadoPagoPublico = {
  numeroPago: 'PAG-6f1c2a',
  estado: 'RECHAZADO',
  fechaAcreditacion: null,
  urlPago: null,
  factura: null,
};

/** MOCK (PB-22): nombres provisionales; el `proveedor` interno es el valor real (D-09). */
const medios: MedioPagoPublicoMock[] = [
  { proveedor: 'pasarela1', nombre: 'Pasarela A', orden: 1, activo: true },
  { proveedor: 'pasarela2', nombre: 'Pasarela B', orden: 2, activo: true },
];

const problemaPasarelaCaida: ProblemDetails = {
  status: 502,
  title: 'Bad Gateway',
  detail: 'La pasarela no está disponible.',
  instance: '/api/publico/pagos',
  traceId,
};

function error(request: Request, problema: ProblemDetails) {
  return HttpResponse.json(
    { ...problema, instance: new URL(request.url).pathname },
    { status: problema.status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

async function leerCuerpo<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

const consultaError = (problema: ProblemDetails) =>
  http.post(consulta, ({ request }) => error(request, problema));
const pagoError = (problema: ProblemDetails) =>
  http.post(pagos, ({ request }) => error(request, problema));
const facturaError = (problema: ProblemDetails) =>
  http.post(factura, ({ request }) => error(request, problema));
const cuponError = (problema: ProblemDetails) =>
  http.post(cupon, ({ request }) => error(request, problema));
const estadoError = (problema: ProblemDetails) =>
  http.post(estadoPago, ({ request }) => error(request, problema));

export const handlers = [
  http.post(consulta, async ({ request }) => {
    const body = await leerCuerpo<ConsultaPublicaRequest>(request);
    if (!body || !regexDni.test(body.dni)) {
      return error(request, problemaValidacion({ Dni: ['El DNI debe tener 8 dígitos.'] }));
    }
    if (!regexPoliza.test(body.numeroPoliza)) {
      return error(
        request,
        problemaValidacion({
          NumeroPoliza: ['El número de póliza debe tener el formato POL-0000000.'],
        }),
      );
    }
    return HttpResponse.json(consultaVigente);
  }),
  http.post(pagos, async ({ request }) => {
    const body = await leerCuerpo<PagoPublicoRequest>(request);
    if (!body || !Array.isArray(body.cuotaIds) || body.cuotaIds.length === 0) {
      return error(request, problemaValidacion({ CuotaIds: ['Debe indicar al menos una cuota.'] }));
    }
    if (body.cuotaIds.length > 24) {
      return error(
        request,
        problemaValidacion({ CuotaIds: ['Demasiadas cuotas en un solo pago.'] }),
      );
    }
    if (body.proveedor !== 'pasarela1' && body.proveedor !== 'pasarela2') {
      return error(request, problemaNegocio('El proveedor de pago indicado no existe.'));
    }
    return HttpResponse.json(pagoCreado, { status: 201 });
  }),
  // RV-D17 (decisión de Martin): estado y factura piden número de pago + DNI, como el back.
  http.post(estadoPago, async ({ request }) => {
    const body = await leerCuerpo<ConsultaEstadoPagoRequest>(request);
    if (!body || !regexDni.test(body.dni)) {
      return error(request, problemaValidacion({ Dni: ['El DNI debe tener 8 dígitos.'] }));
    }
    return HttpResponse.json(estadoAprobado);
  }),
  http.post(factura, async ({ request }) => {
    const body = await leerCuerpo<PublicoFacturaRequest>(request);
    if (!body || !regexDni.test(body.dni)) {
      return error(request, problemaValidacion({ Dni: ['El DNI debe tener 8 dígitos.'] }));
    }
    return HttpResponse.json(facturaAutorizada);
  }),
  http.post(cupon, () => HttpResponse.json(cuponMock)),
  http.get(mediosPago, () => HttpResponse.json(medios)),
];

/** Variantes para instalar con servidorMock.use o worker.use. */
export const variantesPublico = {
  consultaNoEncontrada: consultaError(problemaNoEncontrado(mensajeNoEncontrado)),
  consultaDniInvalido: consultaError(problemaValidacion({ Dni: ['El DNI debe tener 8 dígitos.'] })),
  consultaNumeroInvalido: consultaError(
    problemaValidacion({
      NumeroPoliza: ['El número de póliza debe tener el formato POL-0000000.'],
    }),
  ),
  consulta429: consultaError(problemaRateLimit()),
  consultaCamposVacios: consultaError(
    problemaValidacion({
      Dni: ['The Dni field is required.'],
      NumeroPoliza: ['The NumeroPoliza field is required.'],
    }),
  ),
  sinCuerpoEnTransporte: consultaError(problemaErrorInesperado()),
  pagoProveedorInvalido: pagoError(problemaNegocio('El proveedor de pago indicado no existe.')),
  pagoCuotasDeOtraPoliza: pagoError(
    problemaNegocio('Todas las cuotas deben pertenecer a la póliza indicada.'),
  ),
  pagoCuotaNoPagable: pagoError(
    problemaNegocio('Solo se pueden pagar cuotas pendientes o vencidas (RN11).'),
  ),
  pagoEnCurso: pagoError(
    problemaNegocio('Alguna de las cuotas ya tiene un pago en curso. Intente de nuevo más tarde.'),
  ),
  pagoCuotasRepetidas: pagoError(problemaNegocio('Las cuotas no pueden repetirse.')),
  pagoNoEncontrado: pagoError(problemaNoEncontrado(mensajeNoEncontrado)),
  pagoRateLimit: pagoError(problemaRateLimit()),
  pagoPasarelaCaida: pagoError(problemaPasarelaCaida),
  pagoValidacion: pagoError(problemaValidacion({ CuotaIds: ['Debe indicar al menos una cuota.'] })),
  pagoDniInvalido: pagoError(problemaValidacion({ Dni: ['El DNI debe tener 8 dígitos.'] })),
  pagoDemasiadasCuotas: pagoError(
    problemaValidacion({ CuotaIds: ['Demasiadas cuotas en un solo pago.'] }),
  ),
  pagoProveedorValidacion: pagoError(
    problemaValidacion({ Proveedor: ['The Proveedor field is required.'] }),
  ),
  facturaNoEncontrada: facturaError(problemaNoEncontrado(mensajeNoEncontrado)),
  facturaValidacion: facturaError(
    problemaValidacion({
      Dni: ['El DNI debe tener 8 dígitos.'],
      NumeroPago: ['The NumeroPago field is required.'],
    }),
  ),
  facturaRateLimit: facturaError(problemaRateLimit()),
  facturaPendienteCae: http.post(factura, () => HttpResponse.json(facturaPendienteCae)),
  cuponNoEncontrado: cuponError(problemaNoEncontrado(mensajeNoEncontrado)),
  // D-31-2: texto provisional; el back todavía no define el mensaje del cupón público.
  cuponCuotaPagada: cuponError(
    problemaNegocio('No se puede generar el cupón de una cuota en estado Pagada (RN11).'),
  ),
  cupon429: cuponError(problemaRateLimit()),
  estadoPendiente: http.post(estadoPago, () => HttpResponse.json(estadoPendiente)),
  estadoRechazado: http.post(estadoPago, () => HttpResponse.json(estadoRechazado)),
  estadoNoEncontrado: estadoError(problemaNoEncontrado(mensajeNoEncontrado)),
  estado429: estadoError(problemaRateLimit()),
  mediosPagoVacios: http.get(mediosPago, () => HttpResponse.json([])),
};
