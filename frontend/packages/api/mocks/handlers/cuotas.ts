import { http, HttpResponse, type HttpHandler } from 'msw';

import type { ProblemDetails } from '../../src/dto/comunes';
import type { CuotaListItemMock } from '../../src/dto/polizas';
import { problemaSinSesion } from '../fixtures/comunes';

/**
 * Fixture de cuota vencida global (PB-24).
 * El estado viaja como texto porque PB-13 sigue abierto; el mock imita la forma
 * que el contrato propone para `GET /api/cuotas?estado=Vencida`.
 */
export const CUOTA_VENCIDA: CuotaListItemMock = {
  cuotaId: 'f1000000-0000-0000-0000-000000000002',
  polizaId: 'd1000000-0000-0000-0000-000000000001',
  numeroPoliza: 'POL-0000001',
  clienteNombre: 'Juan Carlos',
  clienteApellido: 'Pérez',
  numeroCuota: 2,
  fechaVencimiento: '2027-01-10',
  importe: 12000,
  recargo: 600,
  estado: 'Vencida',
};

function autorizado(request: Request): boolean {
  return request.headers.get('Authorization')?.startsWith('Bearer ') ?? false;
}

function problema(status: number, body: ProblemDetails): Response {
  return HttpResponse.json(body, {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

/**
 * MOCK (PB-24): `GET /api/cuotas` no existe en el back.
 *
 * El handler solo modela `estado=Vencida`; cualquier otro estado devuelve una
 * página vacía. La UI de B-03 queda oculta hasta que PB-24 se publique.
 */
export const handlers: HttpHandler[] = [
  http.get('*/api/cuotas', ({ request }) => {
    if (!autorizado(request)) return problema(401, problemaSinSesion());

    const url = new URL(request.url);
    const estado = url.searchParams.get('estado');
    const pagina = Number(url.searchParams.get('pagina') ?? '1');
    const tamano = Number(url.searchParams.get('tamano') ?? '20');
    const paginaValida = Number.isInteger(pagina) && pagina >= 1 ? pagina : 1;
    const tamanoValido = Number.isInteger(tamano) && tamano >= 1 && tamano <= 100 ? tamano : 20;

    if (estado !== null && estado !== 'Vencida') {
      return HttpResponse.json({
        items: [],
        pagina: paginaValida,
        tamanoPagina: tamanoValido,
        total: 0,
      });
    }

    const items = paginaValida === 1 ? [CUOTA_VENCIDA].slice(0, tamanoValido) : [];
    return HttpResponse.json({
      items,
      pagina: paginaValida,
      tamanoPagina: tamanoValido,
      total: 1,
    });
  }),
];

/** Variante: no hay cuotas vencidas (widget de B-03 vacío). */
export const cuotasSinVencidas: HttpHandler = http.get('*/api/cuotas', () =>
  HttpResponse.json({ items: [], pagina: 1, tamanoPagina: 20, total: 0 }),
);
