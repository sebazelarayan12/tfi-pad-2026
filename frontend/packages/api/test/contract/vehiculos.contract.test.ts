// @vitest-environment node
import { z } from 'zod';
import { contratoEndpoint } from './harness';
import { CLIENTE_JUAN_ID } from '../../mocks/fixtures/clientes';
import { GUID_VACIO } from '../../mocks/fixtures/vehiculos';
import {
  esMock,
  esquemaVehiculo,
  erroresAuth,
  idVehiculo,
  instalarFixtures,
  solicitud,
} from './soporte-vehiculos-cotizaciones';

instalarFixtures();
const cliente = esMock ? CLIENTE_JUAN_ID : process.env.CONTRACT_CLIENTE_ID || CLIENTE_JUAN_ID;
contratoEndpoint({
  nombre: 'Vehículos activos del cliente',
  metodo: 'GET',
  ruta: '/api/vehiculos',
  requiereSesion: true,
  destructivo: false,
  exito: {
    estado: 200,
    esquema: z.array(esquemaVehiculo.extend({ activo: z.literal(true) })),
    request: () => solicitud(`/api/vehiculos?clienteId=${encodeURIComponent(cliente)}`),
  },
  errores: [
    ...erroresAuth('/api/vehiculos'),
    {
      nombre: 'falta clienteId',
      estado: 400,
      esquema: 'problem',
      request: () => solicitud('/api/vehiculos'),
    },
    {
      nombre: 'clienteId inválido',
      estado: 400,
      esquema: 'validation',
      request: () => solicitud('/api/vehiculos?clienteId=texto'),
    },
  ],
});
contratoEndpoint({
  nombre: 'Detalle del vehículo',
  metodo: 'GET',
  ruta: '/api/vehiculos/{id}',
  requiereSesion: true,
  destructivo: false,
  exito: {
    estado: 200,
    esquema: esquemaVehiculo,
    request: () => solicitud(`/api/vehiculos/${idVehiculo()}`),
  },
  errores: [
    ...erroresAuth(`/api/vehiculos/${idVehiculo()}`),
    {
      nombre: 'inexistente',
      estado: 404,
      esquema: 'problem',
      request: () => solicitud(`/api/vehiculos/${GUID_VACIO}`),
    },
  ],
});
// El harness exige CONTRACT_ALLOW_WRITES=true; nunca se da de baja un vehículo para repetir el alta.
const alta = () => ({ clienteId: cliente, patente: esMock ? 'AE789FG' : patenteReal(), uso: 0 });
function patenteReal(): string {
  const valor = process.env.CONTRACT_PATENTE_ALTA;
  if (!valor)
    throw new Error(
      'Falta CONTRACT_PATENTE_ALTA: seleccionar una patente DNRPA no registrada del cliente de prueba.',
    );
  return valor;
}
contratoEndpoint({
  nombre: 'Alta validada en DNRPA',
  metodo: 'POST',
  ruta: '/api/vehiculos',
  requiereSesion: true,
  destructivo: true,
  exito: {
    estado: 201,
    esquema: esquemaVehiculo,
    request: () => solicitud('/api/vehiculos', 'POST', alta()),
  },
  errores: [
    ...erroresAuth('/api/vehiculos', 'POST', {}),
    {
      nombre: 'validación de modelo',
      estado: 400,
      esquema: 'validation',
      request: () => solicitud('/api/vehiculos', 'POST', {}),
    },
    {
      nombre: 'patente inválida',
      estado: 400,
      esquema: 'problem',
      request: () =>
        solicitud('/api/vehiculos', 'POST', { clienteId: cliente, patente: 'AB12CDE', uso: 0 }),
    },
    {
      nombre: 'cliente inexistente',
      estado: 404,
      esquema: 'problem',
      request: () =>
        solicitud('/api/vehiculos', 'POST', { clienteId: GUID_VACIO, patente: 'AE789FG', uso: 0 }),
    },
  ],
});
