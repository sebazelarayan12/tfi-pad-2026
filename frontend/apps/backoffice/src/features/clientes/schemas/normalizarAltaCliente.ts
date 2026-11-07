import type { ClienteAltaRequest } from '@nexa/api';

import type { AltaClienteValidado } from './altaClienteSchema';
import { aFechaIso } from './formatos';

/**
 * Único lugar que arma el body del alta (FC9): DNI y CUIL ya vienen solo con dígitos del
 * esquema; acá la fecha pasa a `yyyy-MM-dd` y el teléfono vacío a `null`.
 */
export function normalizarAltaCliente(valores: AltaClienteValidado): ClienteAltaRequest {
  return {
    dni: valores.dni,
    sexo: valores.sexo,
    nombre: valores.nombre,
    apellido: valores.apellido,
    cuil: valores.cuil,
    fechaNacimiento: aFechaIso(valores.fechaNacimiento),
    email: valores.email,
    telefono: valores.telefono === '' ? null : valores.telefono,
    calle: valores.calle,
    numero: valores.numero,
    localidad: valores.localidad,
    provincia: valores.provincia,
    codigoPostal: valores.codigoPostal,
  };
}
