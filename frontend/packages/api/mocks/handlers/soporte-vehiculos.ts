import { http, HttpResponse } from 'msw';
import type { ProblemDetails } from '../../src/dto/comunes';
import { tokensMockClientes } from '../fixtures/clientes';
import { problemaSinPermiso, problemaSinSesion } from '../fixtures/comunes';

export function responderProblema(request: Request, problema: ProblemDetails) {
  return HttpResponse.json(
    { ...problema, instance: new URL(request.url).pathname },
    {
      status: problema.status,
      headers: { 'Content-Type': 'application/problem+json' },
    },
  );
}

export function autorizar(request: Request) {
  const auth = request.headers.get('Authorization') ?? '';
  if (!/^Bearer \S+$/i.test(auth) || auth === `Bearer ${tokensMockClientes.invalido}`)
    return responderProblema(request, problemaSinSesion());
  // Etiquetas del fixture: MSW no valida firmas JWT.
  return auth === `Bearer ${tokensMockClientes.sinPermiso}`
    ? responderProblema(request, problemaSinPermiso())
    : null;
}

export function variante(metodo: 'get' | 'post', ruta: string, problema: ProblemDetails) {
  return http[metodo](
    ruta,
    ({ request }) => autorizar(request) ?? responderProblema(request, problema),
  );
}

export async function leerCuerpo(request: Request): Promise<Record<string, unknown>> {
  try {
    const valor: unknown = await request.json();
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
      ? (valor as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
