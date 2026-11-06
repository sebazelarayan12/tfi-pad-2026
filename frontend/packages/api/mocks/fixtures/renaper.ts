import type { ClienteAltaRequest, PersonaRenaperResponse } from '../../src/dto/clientes';
import { clientesFixture } from './clientes';

/** Personas del contrato §3.3 y del RenaperMockService; Lucía es menor en el registro oficial. */
const juan = clientesFixture[0]!.cliente;
const domicilio = {
  calle: juan.calle,
  numero: juan.numero,
  piso: null,
  depto: null,
  localidad: juan.localidad,
  provincia: juan.provincia,
  codigoPostal: juan.codigoPostal,
};
export const personasRenaperFixture: readonly PersonaRenaperResponse[] = [
  {
    dni: juan.dni,
    cuil: juan.cuil,
    nombre: juan.nombre,
    apellido: juan.apellido,
    fechaNacimiento: juan.fechaNacimiento,
    sexo: juan.sexo,
    domicilio,
    estado: 'VIGENTE',
    fechaFallecimiento: null,
  },
  {
    dni: '45123456',
    cuil: '27451234564',
    nombre: 'Lucía',
    apellido: 'Fernández',
    fechaNacimiento: '2010-07-12',
    sexo: 'F',
    domicilio: {
      calle: 'Rivadavia',
      numero: '456',
      piso: '2',
      depto: 'B',
      localidad: 'Yerba Buena',
      provincia: 'Tucumán',
      codigoPostal: '4107',
    },
    estado: 'VIGENTE',
    fechaFallecimiento: null,
  },
  {
    dni: '20111222',
    cuil: '20201112223',
    nombre: 'Roberto Carlos',
    apellido: 'Sosa',
    fechaNacimiento: '1950-01-30',
    sexo: 'M',
    domicilio: {
      ...domicilio,
      calle: 'Belgrano',
      numero: '789',
      localidad: 'Concepción',
      codigoPostal: '4146',
    },
    estado: 'FALLECIDO',
    fechaFallecimiento: '2024-11-02',
  },
];

export const altaClienteFixture: ClienteAltaRequest = {
  dni: juan.dni,
  cuil: juan.cuil,
  nombre: juan.nombre,
  apellido: juan.apellido,
  fechaNacimiento: juan.fechaNacimiento,
  sexo: juan.sexo,
  email: juan.email,
  telefono: null,
  calle: juan.calle,
  numero: juan.numero,
  localidad: juan.localidad,
  provincia: juan.provincia,
  codigoPostal: juan.codigoPostal,
};
