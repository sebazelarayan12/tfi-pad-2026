import { describe, it } from 'vitest';
import { z, type ZodType } from 'zod';

import { esquemaProblemDetails, esquemaValidationProblemDetails } from './esquemas-comunes';
import {
  asegurarSesion,
  instalarSetupContrato,
  leerConfiguracion,
  type ConfiguracionContrato,
} from './setup';

/**
 * Harness de tests de contrato (US-FE-T-23).
 *
 * Valida con el mismo código que una respuesta (de un handler MSW o del back real)
 * cumple `docs/frontend/contratos-api/*.md`: status, content-type, forma del body
 * y forma de los errores. Valida la respuesta cruda, sin `ApiError`, para que un
 * bug del cliente no oculte un bug del contrato.
 *
 * Uso (un archivo `<dominio>.contract.test.ts` por API card, con
 * `// @vitest-environment node` en la primera línea):
 *
 *   import { z } from 'zod';
 *   import { contratoEndpoint } from './harness';
 *   import { fetchContrato } from './setup';
 *
 *   contratoEndpoint({
 *     nombre: 'Listar planes',
 *     metodo: 'GET',
 *     ruta: '/api/planes',
 *     requiereSesion: false,
 *     destructivo: false,
 *     exito: {
 *       estado: 200,
 *       esquema: z.array(z.looseObject({ id: z.string() })),
 *       request: () => fetchContrato('/api/planes'),
 *     },
 *     errores: [],
 *   });
 *
 * Modo por defecto: MSW. `npm run test:contract:real` corre lo mismo contra
 * `VITE_API_BASE_URL` (ver `setup.ts`).
 *
 * Dueño: US-FE-T-23.
 */

export type MetodoContrato = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/** Forma de error esperada: `problem` (A, C, D) o `validation` (B, con `errors`). */
export type FormaError = 'problem' | 'validation';

export interface CasoError {
  nombre: string;
  request: () => Promise<Response>;
  estado: number;
  esquema: FormaError;
}

export interface DefinicionEndpoint {
  nombre: string;
  metodo: MetodoContrato;
  ruta: string;
  requiereSesion: boolean;
  /** `POST`, `PUT`, `DELETE` o `PATCH`: en modo real solo con `CONTRACT_ALLOW_WRITES=true`. */
  destructivo: boolean;
  /** Existe en el mock pero el back real no reproduce el escenario: se omite en modo real. */
  soloMock?: boolean;
  exito: {
    estado: number;
    esquema?: ZodType;
    request: () => Promise<Response>;
  };
  errores: CasoError[];
}

const TIPO_CONTENIDO_ERROR = 'application/problem+json';
const TIPO_CONTENIDO_EXITO = 'application/json';

/**
 * Valida `cuerpo` contra `esquema` y lo devuelve tipado.
 * Lanza con la ruta de cada campo que falla (por ejemplo `items.0.id`).
 */
export function validarRespuesta<T extends ZodType>(esquema: T, cuerpo: unknown): z.output<T> {
  const resultado = esquema.safeParse(cuerpo);
  if (resultado.success) return resultado.data;

  const detalle = resultado.error.issues
    .map((problema) => `${problema.path.join('.') || '(raíz)'}: ${problema.message}`)
    .join('; ');
  throw new Error(`Respuesta fuera de contrato: ${detalle}`);
}

/** Valida un cuerpo de error `ProblemDetails` (forma A, C o D) o `ValidationProblemDetails` (B). */
export function validarProblemDetails(cuerpo: unknown, forma: FormaError = 'problem'): unknown {
  return validarRespuesta(
    forma === 'validation' ? esquemaValidationProblemDetails : esquemaProblemDetails,
    cuerpo,
  );
}

/**
 * Motivo por el que un endpoint no corre en el modo actual, o `null` si corre.
 * El motivo queda visible en el nombre del test omitido.
 */
export function motivoOmision(
  definicion: Pick<DefinicionEndpoint, 'destructivo' | 'soloMock'>,
  configuracion: Pick<ConfiguracionContrato, 'objetivo' | 'permitirEscrituras'>,
): string | null {
  if (configuracion.objetivo !== 'real') return null;
  if (definicion.soloMock === true) {
    return 'solo mock: el back real no reproduce este escenario';
  }
  if (definicion.destructivo && !configuracion.permitirEscrituras) {
    return 'destructivo: requiere CONTRACT_ALLOW_WRITES=true';
  }
  return null;
}

function exigir(condicion: boolean, mensaje: string): void {
  if (!condicion) throw new Error(mensaje);
}

function leerJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(`El cuerpo no es JSON: ${texto.slice(0, 80)}`);
  }
}

/** Ejecuta el caso de éxito. Lanza si la respuesta incumple el contrato. */
export async function ejecutarExito(definicion: DefinicionEndpoint): Promise<void> {
  const { estado, esquema, request } = definicion.exito;
  const respuesta = await request();
  const texto = await respuesta.text();

  exigir(respuesta.status === estado, `Status ${respuesta.status}, se esperaba ${estado}.`);
  if (estado === 204) {
    exigir(texto === '', 'Un 204 no debe traer cuerpo.');
    return;
  }

  const tipo = respuesta.headers.get('content-type') ?? '';
  exigir(
    tipo.includes(TIPO_CONTENIDO_EXITO),
    `Content-Type "${tipo}", se esperaba ${TIPO_CONTENIDO_EXITO}.`,
  );
  if (esquema !== undefined) validarRespuesta(esquema, leerJson(texto));
}

/** Ejecuta un caso de error. Lanza si la respuesta incumple el contrato. */
export async function ejecutarError(caso: CasoError): Promise<void> {
  const respuesta = await caso.request();
  const texto = await respuesta.text();

  exigir(
    respuesta.status === caso.estado,
    `Status ${respuesta.status}, se esperaba ${caso.estado}.`,
  );

  // Forma C: 401 y 403 pueden venir sin cuerpo (`seguridad-clientes-publico.md` §1.2).
  if (texto === '' && (caso.estado === 401 || caso.estado === 403)) return;

  const tipo = respuesta.headers.get('content-type') ?? '';
  exigir(
    tipo.includes(TIPO_CONTENIDO_ERROR),
    `Content-Type "${tipo}", se esperaba ${TIPO_CONTENIDO_ERROR}.`,
  );
  validarProblemDetails(leerJson(texto), caso.esquema);
}

/**
 * Registra los tests de un endpoint: uno por la respuesta de éxito y uno por cada
 * caso de error. Se llama al nivel del archivo, fuera de un `describe`.
 */
export function contratoEndpoint(definicion: DefinicionEndpoint): void {
  const configuracion = leerConfiguracion();
  const motivo = motivoOmision(definicion, configuracion);
  const prueba = motivo === null ? it : it.skip;
  const sufijo = motivo === null ? '' : ` [omitido: ${motivo}]`;

  const conSesion = async <T>(accion: () => Promise<T>): Promise<T> => {
    if (definicion.requiereSesion) await asegurarSesion();
    return accion();
  };

  describe(`${definicion.metodo} ${definicion.ruta}: ${definicion.nombre}`, () => {
    prueba(`éxito ${definicion.exito.estado}${sufijo}`, () =>
      conSesion(() => ejecutarExito(definicion)),
    );
    for (const caso of definicion.errores) {
      prueba(`error ${caso.estado}: ${caso.nombre}${sufijo}`, () =>
        conSesion(() => ejecutarError(caso)),
      );
    }
  });
}

instalarSetupContrato();
