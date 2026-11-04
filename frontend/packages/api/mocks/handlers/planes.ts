import { http, HttpResponse } from 'msw';
import type { ProblemDetails } from '../../src/dto/comunes';
import type { ActivoPlanRequest, PlanRequest, PlanResponse } from '../../src/dto/planes';
import {
  problemaErrorInesperado,
  problemaNegocio,
  problemaNoEncontrado,
  problemaSinPermiso,
  problemaSinSesion,
  problemaValidacion,
} from '../fixtures/comunes';

const ruta = '*/api/planes';
const rutaDetalle = `${ruta}/:id`;
const tipos = ['Auto', 'Moto', 'Camioneta'];

const semillas: readonly PlanResponse[] = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    codigo: 'RC',
    nombre: 'Responsabilidad Civil',
    descripcion: 'Cubre los daños que se le causan a terceros.',
    primaBase: 12000,
    tiposPermitidos: 'Auto,Moto,Camioneta',
    antiguedadMaxima: null,
    activo: true,
  },
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    codigo: 'TC',
    nombre: 'Terceros Completo',
    descripcion: 'Cubre responsabilidad civil, robo, incendio y destrucción total.',
    primaBase: 18000,
    tiposPermitidos: 'Auto,Moto,Camioneta',
    antiguedadMaxima: null,
    activo: true,
  },
  {
    id: 'a1000000-0000-0000-0000-000000000003',
    codigo: 'TR',
    nombre: 'Todo Riesgo',
    descripcion: 'Cubre terceros completo más daños parciales por accidente con franquicia.',
    primaBase: 30000,
    tiposPermitidos: 'Auto,Camioneta',
    antiguedadMaxima: 10,
    activo: true,
  },
];

function responderProblema(request: Request, problema: ProblemDetails) {
  return HttpResponse.json(
    { ...problema, instance: new URL(request.url).pathname },
    { status: problema.status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

const problemaPlanNoExiste = (id: string) => problemaNoEncontrado(`El plan ${id} no existe.`);
const problemaPlanNoActivo = (id: string) =>
  problemaNoEncontrado(`El plan ${id} no existe o no está activo.`);
const problemaCodigoDuplicado = (codigo: string) =>
  problemaNegocio(`Ya existe un plan con el código '${codigo}'.`);
const problemaCodigoDeOtroPlan = (codigo: string) =>
  problemaNegocio(`Ya existe otro plan con el código '${codigo}'.`);
const soloInactivos = (planes: PlanResponse[]) => planes.filter((plan) => !plan.activo);

// Variantes con nombre: cada una responde un error del contrato (vehiculos-planes-cotizaciones.md §4.2 a §4.5).
export const planesError500 = http.get(ruta, ({ request }) =>
  responderProblema(request, problemaErrorInesperado()),
);
export const planNoActivo = http.get(rutaDetalle, ({ request, params }) =>
  responderProblema(request, problemaPlanNoActivo(String(params.id))),
);
export const planNoExiste = http.put(rutaDetalle, ({ request, params }) =>
  responderProblema(request, problemaPlanNoExiste(String(params.id))),
);
export const planNoExisteAlDesactivar = http.delete(rutaDetalle, ({ request, params }) =>
  responderProblema(request, problemaPlanNoExiste(String(params.id))),
);
export const planCodigoDuplicado = http.post(ruta, async ({ request }) => {
  const body = (await request.json()) as PlanRequest;
  return responderProblema(request, problemaCodigoDuplicado(body.codigo.trim().toUpperCase()));
});
export const planCodigoDeOtroPlan = http.put(rutaDetalle, async ({ request }) => {
  const body = (await request.json()) as PlanRequest;
  return responderProblema(request, problemaCodigoDeOtroPlan(body.codigo.trim().toUpperCase()));
});
export const planValidacionErrores = http.post(ruta, ({ request }) =>
  responderProblema(request, problemaValidacion({ Codigo: ['The Codigo field is required.'] })),
);
export const planNombreObligatorio = http.post(ruta, ({ request }) =>
  responderProblema(request, problemaNegocio('El nombre del plan es obligatorio.')),
);
export const planDescripcionObligatoria = http.post(ruta, ({ request }) =>
  responderProblema(request, problemaNegocio('La descripción del plan es obligatoria.')),
);
export const planesInactivos = http.get(ruta, () =>
  HttpResponse.json([{ ...semillas[0], activo: false }]),
);

// Los tests usan credenciales ficticias para simular ambos roles.
export const tokensMockPlanes = {
  administrador: 'mock-planes-admin',
  empleado: 'mock-planes-empleado',
};

function verificarAdmin(request: Request) {
  const auth = request.headers.get('Authorization');
  if (auth === `Bearer ${tokensMockPlanes.administrador}`) return null;
  return responderProblema(
    request,
    auth === `Bearer ${tokensMockPlanes.empleado}` ? problemaSinPermiso() : problemaSinSesion(),
  );
}

function planValidacion(body: PlanRequest) {
  // Nombre, Descripcion y TiposPermitidos vacíos son error de negocio (normalizarPlan), no de validación.
  const campos = [
    ['Codigo', body.codigo, 10, true],
    ['Nombre', body.nombre, 80, false],
    ['Descripcion', body.descripcion, 500, false],
    ['TiposPermitidos', body.tiposPermitidos, 50, false],
  ] as const;
  const errors: Record<string, string[]> = {};
  for (const [campo, valor, limite, requerido] of campos) {
    if (typeof valor !== 'string' || (requerido && !valor.trim())) {
      errors[campo] = [`The ${campo} field is required.`];
    } else if (valor.length > limite) {
      errors[campo] = [`The field ${campo} must be a string with a maximum length of '${limite}'.`];
    }
  }
  return Object.keys(errors).length ? problemaValidacion(errors) : null;
}

function normalizarPlan(body: PlanRequest) {
  if (!body.nombre.trim()) return problemaNegocio('El nombre del plan es obligatorio.');
  if (!body.descripcion.trim()) return problemaNegocio('La descripción del plan es obligatoria.');
  if (body.primaBase <= 0 || !Number.isFinite(body.primaBase)) {
    return problemaNegocio('La prima base debe ser mayor que cero.');
  }
  if (body.antiguedadMaxima != null && body.antiguedadMaxima < 0) {
    return problemaNegocio('La antigüedad máxima debe ser mayor o igual a cero.');
  }
  const permitidos = new Set<string>();
  for (const parte of body.tiposPermitidos
    .split(',')
    .map((tipo) => tipo.trim())
    .filter(Boolean)) {
    const tipo = tipos.find((opcion) => opcion.toLowerCase() === parte.toLowerCase());
    if (!tipo) return problemaNegocio(`El tipo de vehículo '${parte}' no es válido.`);
    permitidos.add(tipo);
  }
  if (!permitidos.size)
    return problemaNegocio('Debe indicar al menos un tipo de vehículo permitido.');
  return {
    codigo: body.codigo.trim().toUpperCase(),
    nombre: body.nombre.trim(),
    descripcion: body.descripcion.trim(),
    primaBase: Math.round((body.primaBase + Number.EPSILON) * 100) / 100,
    tiposPermitidos: [...permitidos].join(','),
    antiguedadMaxima: body.antiguedadMaxima ?? null,
  };
}

export function crearHandlersPlanes() {
  const planes = semillas.map((plan) => ({ ...plan }));
  const buscar = (id: string) => planes.find((plan) => plan.id === id);

  async function guardar(request: Request, anterior?: PlanResponse) {
    const body = (await request.json()) as PlanRequest;
    const validacion = planValidacion(body);
    if (validacion) return responderProblema(request, validacion);
    const datos = normalizarPlan(body);
    if ('status' in datos) return responderProblema(request, datos);
    if (planes.some((plan) => plan.codigo === datos.codigo && plan.id !== anterior?.id)) {
      return responderProblema(
        request,
        anterior ? problemaCodigoDeOtroPlan(datos.codigo) : problemaCodigoDuplicado(datos.codigo),
      );
    }
    if (anterior) {
      Object.assign(anterior, datos);
      return HttpResponse.json(anterior);
    }
    const nuevo = { ...datos, id: crypto.randomUUID(), activo: true };
    planes.push(nuevo);
    return HttpResponse.json(nuevo, {
      status: 201,
      headers: { Location: `/api/planes/${nuevo.id}` },
    });
  }

  return [
    http.get(ruta, ({ request }) => {
      // MOCK PB-09: el backend real ignora incluirInactivos y responde 200 con activos.
      const incluirInactivos = new URL(request.url).searchParams.get('incluirInactivos') === 'true';
      const activos = planes.filter((plan) => plan.activo);
      if (incluirInactivos) {
        const error = verificarAdmin(request);
        if (error) return error;
        activos.push(...soloInactivos(planes));
      }
      return HttpResponse.json(activos.sort((a, b) => a.codigo.localeCompare(b.codigo)));
    }),
    http.get(rutaDetalle, ({ request, params }) => {
      const id = String(params.id);
      const plan = buscar(id);
      return plan?.activo
        ? HttpResponse.json(plan)
        : responderProblema(request, problemaPlanNoActivo(id));
    }),
    http.post(ruta, async ({ request }) => verificarAdmin(request) ?? guardar(request)),
    http.put(rutaDetalle, async ({ request, params }) => {
      const error = verificarAdmin(request);
      if (error) return error;
      const id = String(params.id);
      const plan = buscar(id);
      return plan ? guardar(request, plan) : responderProblema(request, problemaPlanNoExiste(id));
    }),
    http.delete(rutaDetalle, ({ request, params }) => {
      const error = verificarAdmin(request);
      if (error) return error;
      const id = String(params.id);
      const plan = buscar(id);
      if (!plan) return responderProblema(request, problemaPlanNoExiste(id));
      plan.activo = false;
      return new HttpResponse(null, { status: 204 });
    }),
    http.patch(`${rutaDetalle}/activo`, async ({ request, params }) => {
      const error = verificarAdmin(request);
      if (error) return error;
      const id = String(params.id);
      const plan = buscar(id);
      if (!plan) return responderProblema(request, problemaPlanNoExiste(id));
      const body = (await request.json()) as ActivoPlanRequest;
      plan.activo = body.activo;
      return HttpResponse.json(plan);
    }),
  ];
}

export const handlers = crearHandlersPlanes();
