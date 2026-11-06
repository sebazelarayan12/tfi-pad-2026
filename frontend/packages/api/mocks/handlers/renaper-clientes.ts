import type {
  ClienteAltaRequest,
  ClienteResponse,
  PersonaRenaperResponse,
} from '../../src/dto/clientes';

export const mensajeFallecido = 'RN02: La persona figura como fallecida en Renaper.';
export const mensajeMenor = 'RN01: El cliente debe tener 18 años o más.';
export const mensajeNoFigura = (dni: string) => `El DNI '${dni}' no figura en Renaper.`;

export function validarAlta(cuerpo: unknown): Record<string, string[]> {
  const datos =
    typeof cuerpo === 'object' && cuerpo !== null && !Array.isArray(cuerpo)
      ? (cuerpo as Record<string, unknown>)
      : {};
  const errors: Record<string, string[]> = {};
  for (const [propiedad, campo, limite] of [
    ['nombre', 'Nombre', 100],
    ['apellido', 'Apellido', 100],
  ] as const) {
    const valor = datos[propiedad];
    if (typeof valor !== 'string' || !valor.trim())
      errors[campo] = [`The ${campo} field is required.`];
    else if (valor.length > limite)
      errors[campo] = [`The field ${campo} must be a string with a maximum length of '${limite}'.`];
  }
  for (const [propiedad, campo, patron, mensaje] of [
    ['dni', 'Dni', /^\d{8}$/, 'El DNI debe tener 8 dígitos.'],
    ['cuil', 'Cuil', /^\d{11}$/, 'El CUIL debe tener 11 dígitos.'],
  ] as const) {
    const valor = datos[propiedad];
    if (typeof valor !== 'string' || !valor.trim())
      errors[campo] = [`The ${campo} field is required.`];
    else if (!patron.test(valor)) errors[campo] = [mensaje];
  }
  if (datos.sexo == null) errors.Sexo = ['The Sexo field is required.'];
  else if (typeof datos.sexo !== 'string' || datos.sexo.length !== 1)
    errors.Sexo = ['The JSON value could not be converted.'];
  const fecha = datos.fechaNacimiento;
  if (fecha == null) errors.FechaNacimiento = ['The FechaNacimiento field is required.'];
  else if (
    typeof fecha !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
    fecha < '0001-01-01' ||
    !Number.isFinite(Date.parse(`${fecha}T00:00:00Z`)) ||
    new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) !== fecha
  )
    errors.FechaNacimiento = ['The JSON value could not be converted.'];
  return errors;
}

/** Misma fecha civil de negocio en Argentina que RN01; no se parsea DateOnly en hora local. */
export function esMenor(fechaNacimiento: string, ahora: Date) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(ahora);
  const leer = (tipo: string) => Number(partes.find((p) => p.type === tipo)!.value);
  const [anio, mes, dia] = fechaNacimiento.split('-').map(Number) as [number, number, number];
  return (
    leer('year') -
      anio -
      (leer('month') < mes || (leer('month') === mes && leer('day') < dia) ? 1 : 0) <
    18
  );
}

export function aplicarRenaper(
  cliente: ClienteResponse,
  persona: PersonaRenaperResponse,
  ahora: Date,
) {
  const { calle, numero, localidad, provincia, codigoPostal } = persona.domicilio;
  Object.assign(cliente, {
    nombre: persona.nombre.trim(),
    apellido: persona.apellido.trim(),
    cuil: persona.cuil.trim(),
    fechaNacimiento: persona.fechaNacimiento,
    sexo: persona.sexo.toUpperCase(),
    calle: calle.trim(),
    numero: numero.trim(),
    localidad: localidad.trim(),
    provincia: provincia.trim(),
    codigoPostal: codigoPostal.trim(),
    validadoRenaper: true,
    fechaValidacionRenaper: ahora.toISOString(),
  });
}

export function clienteIngresado(datos: ClienteAltaRequest): ClienteResponse {
  return {
    id: crypto.randomUUID(),
    dni: datos.dni.trim(),
    cuil: datos.cuil.trim(),
    nombre: datos.nombre.trim(),
    apellido: datos.apellido.trim(),
    fechaNacimiento: datos.fechaNacimiento,
    sexo: datos.sexo.toUpperCase() as ClienteAltaRequest['sexo'],
    email: datos.email.trim(),
    telefono: datos.telefono?.trim() || null,
    calle: datos.calle.trim(),
    numero: datos.numero.trim(),
    localidad: datos.localidad.trim(),
    provincia: datos.provincia.trim(),
    codigoPostal: datos.codigoPostal.trim(),
    activo: true,
    validadoRenaper: false,
    fechaValidacionRenaper: null,
  };
}
