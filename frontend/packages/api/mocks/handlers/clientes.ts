import { http, HttpResponse } from 'msw';
import type {
  ClienteModificacionRequest,
  ClienteResumenResponse,
  ClienteAltaRequest,
} from '../../src/dto/clientes';
import type { ProblemDetails } from '../../src/dto/comunes';
import { clientesFixture, tokensMockClientes, type ClienteFixture } from '../fixtures/clientes';
import { personasRenaperFixture } from '../fixtures/renaper';
import {
  validarAlta,
  esMenor,
  aplicarRenaper,
  clienteIngresado,
  mensajeFallecido,
  mensajeMenor,
  mensajeNoFigura,
} from './renaper-clientes';
import {
  problemaNegocio,
  problemaNoEncontrado,
  problemaSinPermiso,
  problemaSinSesion,
  problemaValidacion,
  problemaErrorInesperado,
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
export function crearHandlersClientes(
  semillas: readonly ClienteFixture[] = clientesFixture,
  opciones: { renaperDisponible?: boolean; ahora?: () => Date } = {},
) {
  const registros = structuredClone([...semillas]);
  const ahora = opciones.ahora ?? (() => new Date());
  const buscar = (id: string) => registros.find(({ cliente }) => cliente.id === id.toLowerCase());
  const noEncontrado = (request: Request, id: string) =>
    responderProblema(
      request,
      problemaNoEncontrado(`El cliente ${id} no existe.`, 'CLIENTE_NO_ENCONTRADO'),
    );

  return [
    http.get(`${ruta}/renaper/:dni`, ({ request, params }) => {
      const error = autorizar(request);
      if (error) return error;
      const dni = String(params.dni).trim();
      if (!/^[0-9]{8}$/.test(dni))
        return responderProblema(request, problemaNegocio('El DNI debe tener 8 dígitos.'));
      if (opciones.renaperDisponible === false)
        return responderProblema(request, problemaRenaperCaido);
      const persona = personasRenaperFixture.find((p) => p.dni === dni);
      return persona
        ? HttpResponse.json(persona)
        : responderProblema(
            request,
            problemaNoEncontrado(mensajeNoFigura(dni), 'PERSONA_NO_ENCONTRADA'),
          );
    }),
    http.post(ruta, async ({ request }) => {
      const error = autorizar(request);
      if (error) return error;
      let cuerpo: unknown;
      try {
        cuerpo = await request.json();
      } catch {
        return responderProblema(request, problemaValidacion({ $: ['Invalid JSON.'] }));
      }
      const errors = { ...validarContacto(cuerpo), ...validarAlta(cuerpo) };
      if (Object.keys(errors).length) return responderProblema(request, problemaValidacion(errors));
      const datos = cuerpo as ClienteAltaRequest;
      if (!['M', 'F', 'X'].includes(datos.sexo.toUpperCase()))
        return responderProblema(request, problemaNegocio('El sexo debe ser M, F o X.'));
      const dni = datos.dni.trim();
      const email = datos.email.trim();
      if (registros.some((r) => r.cliente.dni === dni))
        return responderProblema(
          request,
          problemaNegocio(`RN01: Ya existe un cliente con el DNI '${dni}'.`),
        );
      if (registros.some((r) => r.cliente.email.toLowerCase() === email.toLowerCase()))
        return responderProblema(
          request,
          problemaNegocio(`RN01: Ya existe un cliente con el email '${email}'.`),
        );
      const persona =
        opciones.renaperDisponible === false
          ? undefined
          : personasRenaperFixture.find((p) => p.dni === dni);
      if (persona?.estado === 'FALLECIDO')
        return responderProblema(request, problemaNegocio(mensajeFallecido));
      if (!persona && opciones.renaperDisponible !== false)
        return responderProblema(request, problemaNegocio(mensajeNoFigura(dni)));
      if (esMenor(persona?.fechaNacimiento ?? datos.fechaNacimiento, ahora()))
        return responderProblema(request, problemaNegocio(mensajeMenor));
      const cliente = clienteIngresado(datos);
      if (persona) aplicarRenaper(cliente, persona, ahora());
      registros.push({
        cliente,
        tienePolizaActiva: false,
        cuenta: { deudaVencida: 0, cuotaVencidaConRecargo: null, proximaCuota: null },
      });
      return HttpResponse.json(cliente, {
        status: 201,
        headers: { Location: `/api/clientes/${cliente.id}` },
      });
    }),
    http.post(`${rutaDetalle}/validar-renaper`, ({ request, params }) => {
      const error = autorizar(request);
      if (error) return error;
      const id = String(params.id);
      if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id))
        return new HttpResponse(null, { status: 404 });
      const registro = buscar(id);
      // CU04 consulta por id incluso un cliente inactivo; CU05 conserva sus propias reglas.
      if (!registro) return noEncontrado(request, id);
      if (opciones.renaperDisponible === false)
        return responderProblema(request, problemaRenaperCaido);
      const persona = personasRenaperFixture.find((p) => p.dni === registro.cliente.dni);
      if (!persona)
        return responderProblema(request, problemaNegocio(mensajeNoFigura(registro.cliente.dni)));
      if (persona.estado === 'FALLECIDO')
        return responderProblema(request, problemaNegocio(mensajeFallecido));
      if (esMenor(persona.fechaNacimiento, ahora()))
        return responderProblema(request, problemaNegocio(mensajeMenor));
      aplicarRenaper(registro.cliente, persona, ahora());
      return HttpResponse.json(registro.cliente);
    }),
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

const problemaRenaperCaido: ProblemDetails = {
  status: 502,
  title: 'Bad Gateway',
  detail: 'Renaper no respondió a la consulta.',
};
const variante = (metodo: 'get' | 'post', path: string, problema: ProblemDetails) =>
  http[metodo](path, ({ request }) => autorizar(request) ?? responderProblema(request, problema));

/** Errores activables por nombre; no se interpretan mensajes en los requests. */
export const variantesClientesAltaRenaper = {
  altaDniDuplicado: variante(
    'post',
    ruta,
    problemaNegocio("RN01: Ya existe un cliente con el DNI '30123456'."),
  ),
  altaEmailDuplicado: variante(
    'post',
    ruta,
    problemaNegocio("RN01: Ya existe un cliente con el email 'juan.perez@ejemplo.com'."),
  ),
  altaRenaperFallecido: variante('post', ruta, problemaNegocio(mensajeFallecido)),
  altaRenaperNoFigura: variante('post', ruta, problemaNegocio(mensajeNoFigura('99999999'))),
  altaMenorDeEdad: variante('post', ruta, problemaNegocio(mensajeMenor)),
  altaSexoInvalido: variante('post', ruta, problemaNegocio('El sexo debe ser M, F o X.')),
  altaValidacionModelo: variante(
    'post',
    ruta,
    problemaValidacion({
      Dni: ['El DNI debe tener 8 dígitos.'],
      Cuil: ['El CUIL debe tener 11 dígitos.'],
    }),
  ),
  altaError500: variante('post', ruta, problemaErrorInesperado()),
  // C8: esta variante es un éxito; la fábrica permite además probar la persistencia durante la caída.
  altaRenaperCaido: http.post(ruta, async ({ request }) => {
    const error = autorizar(request);
    if (error) return error;
    const cuerpo: unknown = await request.json();
    const errors = { ...validarContacto(cuerpo), ...validarAlta(cuerpo) };
    if (Object.keys(errors).length) return responderProblema(request, problemaValidacion(errors));
    const datos = cuerpo as ClienteAltaRequest;
    if (!['M', 'F', 'X'].includes(datos.sexo.toUpperCase()))
      return responderProblema(request, problemaNegocio('El sexo debe ser M, F o X.'));
    if (esMenor(datos.fechaNacimiento, new Date()))
      return responderProblema(request, problemaNegocio(mensajeMenor));
    return HttpResponse.json(clienteIngresado(datos), { status: 201 });
  }),
  renaperFallecido: http.get(
    `${ruta}/renaper/:dni`,
    ({ request }) => autorizar(request) ?? HttpResponse.json(personasRenaperFixture[2]!),
  ),
  renaperNoFigura: variante(
    'get',
    `${ruta}/renaper/:dni`,
    problemaNoEncontrado(mensajeNoFigura('99999999'), 'PERSONA_NO_ENCONTRADA'),
  ),
  renaperDniInvalido: variante(
    'get',
    `${ruta}/renaper/:dni`,
    problemaNegocio('El DNI debe tener 8 dígitos.'),
  ),
  renaperCaido: variante('get', `${ruta}/renaper/:dni`, problemaRenaperCaido),
  validarRenaperNoFigura: variante(
    'post',
    `${rutaDetalle}/validar-renaper`,
    problemaNegocio(mensajeNoFigura('99999999')),
  ),
  validarRenaperFallecido: variante(
    'post',
    `${rutaDetalle}/validar-renaper`,
    problemaNegocio(mensajeFallecido),
  ),
  validarRenaperMenor: variante(
    'post',
    `${rutaDetalle}/validar-renaper`,
    problemaNegocio(mensajeMenor),
  ),
  clienteNoExiste: variante(
    'post',
    `${rutaDetalle}/validar-renaper`,
    problemaNoEncontrado(
      'El cliente 00000000-0000-0000-0000-000000000000 no existe.',
      'CLIENTE_NO_ENCONTRADO',
    ),
  ),
  validarRenaperCaido: variante('post', `${rutaDetalle}/validar-renaper`, problemaRenaperCaido),
  sinToken: http.all(/\/api\/clientes(?:\/|$)/, ({ request }) =>
    responderProblema(request, problemaSinSesion()),
  ),
};
