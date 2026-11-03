type ApiErrorKind = 'http' | 'red' | 'respuesta-invalida';

interface ApiErrorOptions {
  status: number;
  kind: ApiErrorKind;
  title?: string | null;
  detail?: string | null;
  traceId?: string | null;
  codigo?: string | null;
  errors?: Record<string, string[]> | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly title: string | null;
  readonly detail: string | null;
  readonly traceId: string | null;
  readonly codigo: string | null;
  readonly errors: Record<string, string[]> | null;

  constructor(options: ApiErrorOptions) {
    super(options.detail ?? `Error de la API (${options.status})`);
    this.name = 'ApiError';
    this.status = options.status;
    this.kind = options.kind;
    this.title = options.title ?? null;
    this.detail = options.detail ?? null;
    this.traceId = options.traceId ?? null;
    this.codigo = options.codigo ?? null;
    this.errors = options.errors ?? null;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFieldErrors(value: unknown): value is Record<string, string[]> {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (messages) =>
        Array.isArray(messages) && messages.every((message) => typeof message === 'string'),
    )
  );
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function parseProblemDetails(contentType: string | null, text: string): Record<string, unknown> {
  if (!contentType?.toLowerCase().includes('json') || !text) return {};
  try {
    const value: unknown = JSON.parse(text);
    return isRecord(value) ? value : {};
  } catch {
    return {};
  }
}

export function parseHttpError(status: number, contentType: string | null, text: string): ApiError {
  const { title, detail, traceId, codigo, errors } = parseProblemDetails(contentType, text);
  return new ApiError({
    status,
    kind: 'http',
    title: asString(title),
    detail: asString(detail),
    traceId: asString(traceId),
    codigo: asString(codigo),
    errors: isFieldErrors(errors) ? errors : null,
  });
}
