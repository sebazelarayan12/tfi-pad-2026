/**
 * Tipos comunes del contrato del back.
 * Convenciones: `contratos-api/convenciones-transversales.md` §3.4 y §6.1.
 *
 * Dueño: US-FE-T-12. Los dominios no redefinen estos tipos genéricos.
 */

/**
 * Forma común de error del back (`application/problem+json`).
 * Fuentes: ExceptionMiddleware (A), auth (B), RN20 (C) y validación automática (D).
 */
export interface ProblemDetails {
  /** Siempre presente. */
  status: number;
  /** A y C: `null`. D: URI de RFC 9110. No se usa para decidir nada. */
  type?: string | null;
  /** Texto de ASP.NET en inglés. No mostrar al usuario. */
  title?: string | null;
  /** Mensaje en español generado por el back. */
  detail?: string | null;
  /** Path del request, sin query string. */
  instance?: string | null;
  /** Útil para soporte. */
  traceId?: string | null;
  /** Solo en algunos 404 (hoy: `CLIENTE_NO_ENCONTRADO`). */
  codigo?: string;
  /** Solo en el 400 de validación automática. Claves = nombre C# (PascalCase). */
  errors?: Record<string, string[]>;
}

/** 400 de validación automática de `[ApiController]` (fuente D). */
export interface ValidationProblemDetails extends ProblemDetails {
  status: 400;
  errors: Record<string, string[]>;
}

/**
 * Query de paginación. El request usa `tamano`; la respuesta usa `tamanoPagina`.
 * `pagina` >= 1 (default 1) y `tamano` de 1 a 100 (default 20).
 */
export interface PaginaRequest {
  pagina?: number;
  tamano?: number;
}

/** Respuesta paginada del back (`PaginaResponse<T>`). */
export interface PaginaResponse<T> {
  items: T[];
  pagina: number;
  tamanoPagina: number;
  total: number;
}
