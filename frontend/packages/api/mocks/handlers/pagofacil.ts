import { http, HttpResponse } from 'msw';
import type { ProblemDetails } from '../../src/dto/comunes';
import type {
  CuponPagoFacilResponse,
  HistorialRendicionResponse,
  RendicionResponse,
} from '../../src/dto/pagofacil';
import {
  problemaErrorInesperado,
  problemaNegocio,
  problemaNoEncontrado,
  problemaSinPermiso,
  problemaSinSesion,
  problemaValidacion,
} from '../fixtures/comunes';

const ruta = '*/api/pagofacil';
const rendiciones = `${ruta}/rendiciones`;
const basePositiva = `${ruta}/base-positiva`;
const cupon = `${ruta}/cuotas/:cuotaId/cupon`;
const codigoBarras = '123450120000020261210000000100112600001026';
const fechaProceso = '2026-11-20T12:00:00Z';
const idRendicion = 'f2000000-0000-0000-0000-000000000001';

const archivoBase =
  [
    'H1234520261120'.padEnd(97),
    `D301234560000001001000120000020261210000126000020261220${codigoBarras}`,
    'T0000001000000001200000'.padEnd(97),
  ].join('\r\n') + '\r\n';

function error(request: Request, problema: ProblemDetails) {
  return HttpResponse.json(
    { ...problema, instance: new URL(request.url).pathname },
    { status: problema.status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

function sinToken(request: Request) {
  return request.headers.get('Authorization') ? null : error(request, problemaSinSesion());
}

function resultado(
  nombreArchivo: string,
  errores: RendicionResponse['errores'] = [],
): RendicionResponse {
  return {
    id: idRendicion,
    nombreArchivo,
    cantidadRegistros: 3,
    importeTotal: 36000,
    procesadas: 3 - errores.length,
    rechazadas: errores.length,
    errores,
  };
}

async function recibirRendicion(request: Request) {
  const archivo = (await request.formData()).get('archivo');
  if (!archivo || typeof archivo === 'string') {
    return error(request, problemaValidacion({ archivo: ['The archivo field is required.'] }));
  }
  return HttpResponse.json(resultado(archivo.name), { status: 201 });
}

export const handlers = [
  http.post(rendiciones, ({ request }) => sinToken(request) ?? recibirRendicion(request)),
  http.get(
    rendiciones,
    ({ request }) =>
      sinToken(request) ??
      HttpResponse.json<HistorialRendicionResponse[]>([
        {
          id: idRendicion,
          nombreArchivo: 'rendicion.txt',
          fechaRendicion: '2026-11-20',
          fechaProceso,
          cantidadRegistros: 3,
          importeTotal: 36000,
          pagosAprobados: 3,
        },
      ]),
  ),
  http.get(
    basePositiva,
    ({ request }) =>
      sinToken(request) ??
      HttpResponse.text(archivoBase, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename="BASEPOS_12345_20261120.txt"',
        },
      }),
  ),
  http.get(
    cupon,
    ({ request, params }) =>
      sinToken(request) ??
      HttpResponse.json<CuponPagoFacilResponse>({
        cuotaId: String(params.cuotaId),
        numeroPoliza: 'POL-0000001',
        numeroCuota: 1,
        importePrimerVencimiento: 12000,
        fechaPrimerVencimiento: '2026-12-10',
        importeSegundoVencimiento: 12600,
        fechaSegundoVencimiento: '2026-12-20',
        codigoBarras,
      }),
  ),
];

const rendicionError = (detail: string) =>
  http.post(rendiciones, ({ request }) => error(request, problemaNegocio(detail)));
const cuponError = (problema: ProblemDetails) =>
  http.get(cupon, ({ request }) => error(request, problema));
const desborde = problemaNegocio('El importe 100000.00 no entra en el código de Pago Fácil.');

/** Variantes para instalar con servidorMock.use o worker.use. */
export const variantesPagoFacil = {
  rendicionConRechazos: http.post(rendiciones, async ({ request }) => {
    const archivo = (await request.formData()).get('archivo');
    return HttpResponse.json(
      resultado(archivo && typeof archivo !== 'string' ? archivo.name : 'rendicion.txt', [
        { linea: 2, motivo: 'El código de barras no es válido (dígito verificador).' },
        { linea: 3, motivo: 'La póliza POL-0000002 no existe.' },
      ]),
      { status: 201 },
    );
  }),
  rendicionNombreInvalido: rendicionError(
    "El nombre del archivo debe tener entre 1 y 90 caracteres: letras sin acento, dígitos, '.', '-' o '_'.",
  ),
  rendicionSuperaTamano: rendicionError('El archivo supera el máximo de 5 MB.'),
  rendicionLineasMalFormadas: rendicionError(
    'El archivo de rendición tiene líneas mal formadas: línea 1: La línea tiene 59 caracteres y deben ser 60.; línea 2: La línea solo puede tener dígitos.',
  ),
  rendicionVacia: rendicionError('El archivo de rendición está vacío.'),
  rendicionYaProcesada: (nombre: string) =>
    rendicionError(`El archivo ${nombre} ya fue procesado (RN18).`),
  rendicionFallaInesperada: http.post(rendiciones, ({ request }) =>
    error(request, problemaErrorInesperado()),
  ),
  rendicionTransporte413: http.post(rendiciones, () => new HttpResponse(null, { status: 413 })),
  basePositivaDesborde: http.get(basePositiva, ({ request }) => error(request, desborde)),
  basePositivaFallaInesperada: http.get(basePositiva, ({ request }) =>
    error(request, problemaErrorInesperado()),
  ),
  basePositivaSinToken: http.get(basePositiva, ({ request }) =>
    error(request, problemaSinSesion()),
  ),
  basePositivaJsonConTextPlain: http.get(basePositiva, () =>
    HttpResponse.text(archivoBase, { headers: { 'Content-Type': 'application/json' } }),
  ),
  cuponCuotaPagada: cuponError(
    problemaNegocio('No se puede generar el cupón de una cuota en estado Pagada (RN11).'),
  ),
  cuponCuotaAnulada: cuponError(
    problemaNegocio('No se puede generar el cupón de una cuota en estado Anulada (RN11).'),
  ),
  cuotaNoExiste: cuponError(problemaNoEncontrado('La cuota no existe.')),
  polizaNoExiste: cuponError(problemaNoEncontrado('La póliza de la cuota no existe.')),
  cuponDesborde: cuponError(desborde),
  cuponPolizaInvalida: cuponError(
    problemaNegocio('El número de póliza INVALIDO no tiene un formato válido.'),
  ),
  cuponFallaInesperada: cuponError(problemaErrorInesperado()),
  sinToken: http.all(`${ruta}/*`, ({ request }) => error(request, problemaSinSesion())),
  sinPermiso: http.all(`${ruta}/*`, ({ request }) => error(request, problemaSinPermiso())),
};
