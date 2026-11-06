import { http, HttpResponse, type HttpHandler } from 'msw';
import { problemaSinSesion } from '../fixtures/comunes';
import { resumenInicio } from '../fixtures/inicio';

export const handlers: HttpHandler[] = [
  http.get('*/api/inicio/resumen', ({ request }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json(problemaSinSesion(), { status: 401 });
    }
    return HttpResponse.json(resumenInicio);
  }),
];
