import type { ProblemDetails, ValidationProblemDetails } from '../../src/dto/comunes';

const traceId = '00-00000000000000000000000000000001-0000000000000001-01';

export function problemaNegocio(detail: string): ProblemDetails {
  return { status: 400, title: 'Bad Request', detail, traceId };
}

export function problemaNoEncontrado(detail: string, codigo?: string): ProblemDetails {
  return {
    status: 404,
    title: 'Not Found',
    detail,
    traceId,
    ...(codigo === undefined ? {} : { codigo }),
  };
}

export function problemaValidacion(errors: Record<string, string[]>): ValidationProblemDetails {
  return { status: 400, title: 'One or more validation errors occurred.', errors, traceId };
}

export function problemaSinSesion(): ProblemDetails {
  return { status: 401, title: 'Unauthorized', traceId };
}

export function problemaSinPermiso(): ProblemDetails {
  return { status: 403, title: 'Forbidden', traceId };
}

export function problemaRateLimit(): ProblemDetails {
  return {
    status: 429,
    title: 'Too Many Requests',
    detail: 'Se superó el límite de intentos. Volvé a intentarlo en un minuto.',
    traceId,
  };
}

export function problemaErrorInesperado(): ProblemDetails {
  return {
    status: 500,
    title: 'Internal Server Error',
    detail: 'Ocurrió un error inesperado.',
    traceId,
  };
}
