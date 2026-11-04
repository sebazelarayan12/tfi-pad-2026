import { http, HttpResponse } from 'msw';
import type { ClienteModificacionRequest, ClienteResumenResponse } from '../../src/dto/clientes';
import type { ProblemDetails } from '../../src/dto/comunes';
import { clientesFixture, tokensMockClientes, type ClienteFixture } from '../fixtures/clientes';
import {
  problemaNegocio,
  problemaNoEncontrado,
  problemaSinPermiso,
  problemaSinSesion,
  problemaValidacion,
} from '../fixtures/comunes';

const ruta = '*/api/clientes';
const rutaDetalle = `${ruta}/:id`;
const camposContacto = [
  ['email', 'Email', 150],
  ['calle', 'Calle', 150],
  ['numero', 'Numero', 20],
  ['localidad', 'Localidad', 100],
  ['provincia', 'Provincia', 100],
  ['codigoPostal', 'CodigoPostal', 10],
] as const;

function responderProblema(request: Request, problema: ProblemDetails) {
  return HttpResponse.json(
    { ...problema, instance: new URL(request.url).pathname },
    { status: problema.status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

function autorizar(request: Request) {
  const auth = request.headers.get('Authorization') ?? '';
  if (!/^Bearer \S+$/i.test(auth) || auth === `Bearer ${tokensMockClientes.invalido}`) {
    return responderProblema(request, problemaSinSesion());
  }
  if (auth === `Bearer ${tokensMockClientes.sinPermiso}`) {
    return responderProblema(request, problemaSinPermiso());
  }
  // MSW acepta tokens opacos del fixture o harness; no valida JWT de producción.
  return null;
}

function validarContacto(cuerpo: unknown): Record<string, string[]> {
  const datos: Record<string, unknown> =
    typeof cuerpo === 'object' && cuerpo !== null && !Array.isArray(cuerpo)
      ? (cuerpo as Record<string, unknown>)
      : {};
  const errors: Record<string, string[]> = {};
  for (const [propiedad, campo, limite] of camposContacto) {
    const valor = datos[propiedad];
    if (typeof valor !== 'string' || !valor.trim()) {
      errors[campo] = [`The ${campo} field is required.`];
    } else if (valor.length > limite) {
      errors[campo] = [`The field ${campo} must be a string with a maximum length of '${limite}'.`];
    } else if (propiedad === 'email' && !/^[^@\s]+@[^@\s]+$/.test(valor.trim())) {
      errors.Email = ['The Email field is not a valid e-mail address.'];
    }
  }
  const telefono: unknown = 'telefono' in datos ? datos.telefono : undefined;
  if (telefono != null && (typeof telefono !== 'string' || telefono.length > 20)) {
    errors.Telefono = ["The field Telefono must be a string with a maximum length of '20'."];
  }
  return errors;
}

function leerEntero(valor: string | null, defecto: number, maximo: number): number | null {
  if (valor === null) return defecto;
  if (!/^[+-]?\d+$/.test(valor.trim())) return null;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 1 && numero <= maximo ? numero : null;
}

/** Cada fábrica aísla el estado para que las bajas y ediciones no se filtren entre pruebas. */
export function crearHandlersClientes(semillas: readonly ClienteFixture[] = clientesFixture) {
  const registros = structuredClone(semillas);
  const buscar = (id: string) => registros.find(({ cliente }) => cliente.id === id.toLowerCase());
  const noEncontrado = (request: Request, id: string) =>
    responderProblema(
      request,
      problemaNoEncontrado(`El cliente ${id} no existe.`, 'CLIENTE_NO_ENCONTRADO'),
    );

  return [
    http.get(ruta, ({ request }) => {
      const error = autorizar(request);
      if (error) return error;
      const params = new URL(request.url).searchParams;
      const pagina = leerEntero(params.get('pagina'), 1, 21474836);
      const tamanoPagina = leerEntero(params.get('tamanoPagina'), 20, 100);
      const errors: Record<string, string[]> = {};
      if (pagina === null) errors.Pagina = ['The field Pagina must be between 1 and 21474836.'];
      if (tamanoPagina === null)
        errors.TamanoPagina = ['The field TamanoPagina must be between 1 and 100.'];
      if (pagina === null || tamanoPagina === null) {
        return responderProblema(request, problemaValidacion(errors));
      }
      const dni = params.get('dni')?.trim();
      const apellido = params.get('apellido')?.trim().toLocaleLowerCase('es-AR');
      const coincidencias = registros
        .map(({ cliente }) => cliente)
        .filter(
          (cliente) =>
            cliente.activo &&
            (!dni || cliente.dni === dni) &&
            (!apellido || cliente.apellido.toLocaleLowerCase('es-AR').includes(apellido)),
        )
        .sort(
          (a, b) =>
            a.apellido.localeCompare(b.apellido, 'es-AR') ||
            a.nombre.localeCompare(b.nombre, 'es-AR') ||
            a.dni.localeCompare(b.dni),
        );
      const items: ClienteResumenResponse[] = coincidencias
        .slice((pagina - 1) * tamanoPagina, pagina * tamanoPagina)
        .map(({ id, dni, nombre, apellido, email, telefono, activo }) => ({
          id,
          dni,
          nombre,
          apellido,
          email,
          telefono,
          activo,
        }));
      return HttpResponse.json({ items, pagina, tamanoPagina, total: coincidencias.length });
    }),
    http.get(`${rutaDetalle}/cuenta`, ({ request, params }) => {
      const error = autorizar(request);
      if (error) return error;
      const id = String(params.id);
      const registro = buscar(id);
      return registro?.cliente.activo
        ? HttpResponse.json(registro.cuenta)
        : noEncontrado(request, id);
    }),
    http.get(rutaDetalle, ({ request, params }) => {
      const error = autorizar(request);
      if (error) return error;
      const id = String(params.id);
      const registro = buscar(id);
      return registro?.cliente.activo
        ? HttpResponse.json(registro.cliente)
        : noEncontrado(request, id);
    }),
    http.put(rutaDetalle, async ({ request, params }) => {
      const error = autorizar(request);
      if (error) return error;
      let cuerpo: unknown;
      try {
        cuerpo = await request.json();
      } catch {
        return responderProblema(request, problemaValidacion({ $: ['Invalid JSON.'] }));
      }
      const errors = validarContacto(cuerpo);
      if (Object.keys(errors).length) return responderProblema(request, problemaValidacion(errors));
      const id = String(params.id);
      const registro = buscar(id);
      if (!registro?.cliente.activo) return noEncontrado(request, id);
      const datos = cuerpo as ClienteModificacionRequest;
      const email = datos.email.trim();
      if (
        registros.some(
          ({ cliente }) =>
            cliente.id !== registro.cliente.id &&
            cliente.email.toLowerCase() === email.toLowerCase(),
        )
      ) {
        return responderProblema(
          request,
          problemaNegocio(`RN01: Ya existe un cliente con el email '${email}'.`),
        );
      }
      // Solo se editan estos campos; las propiedades de identidad o Renaper se ignoran como en la API.
      Object.assign(registro.cliente, {
        email,
        telefono: datos.telefono?.trim() || null,
        calle: datos.calle.trim(),
        numero: datos.numero.trim(),
        localidad: datos.localidad.trim(),
        provincia: datos.provincia.trim(),
        codigoPostal: datos.codigoPostal.trim(),
      });
      return HttpResponse.json(registro.cliente);
    }),
    http.delete(rutaDetalle, ({ request, params }) => {
      const error = autorizar(request);
      if (error) return error;
      const id = String(params.id);
      const registro = buscar(id);
      if (!registro?.cliente.activo) return noEncontrado(request, id);
      if (registro.tienePolizaActiva) {
        return responderProblema(
          request,
          problemaNegocio(
            `El cliente ${id} tiene una póliza activa (Pendiente, Vigente o Suspendida) y no puede darse de baja.`,
          ),
        );
      }
      registro.cliente.activo = false;
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

export const handlers = crearHandlersClientes();
