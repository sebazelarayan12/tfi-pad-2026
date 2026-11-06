import type { VehiculoResponse } from '../../src/dto/vehiculos';
import { CLIENTE_JUAN_ID } from './clientes';

export const VEHICULO_ID = 'b1000000-0000-0000-0000-000000000001';
export const VEHICULO_BAJA_ID = 'b1000000-0000-0000-0000-000000000002';
export const COTIZACION_ID = '0c1d2e3f-4a5b-4c6d-8e7f-901a2b3c4d5e';
export const GUID_VACIO = '00000000-0000-0000-0000-000000000000';
export const esGuid = (valor: unknown): valor is string =>
  typeof valor === 'string' && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(valor);

/** Datos del contrato §1.7; solo el registro DNRPA contiene el titular. */
export const dnrpaFixture = [
  {
    patente: 'AB123CD',
    marca: 'Toyota',
    modelo: 'Corolla XEi',
    anio: 2021,
    tipo: 0,
    dni: '30123456',
  },
  {
    patente: 'AE789FG',
    marca: 'Toyota',
    modelo: 'Hilux SRX',
    anio: 2023,
    tipo: 2,
    dni: '30123456',
  },
  {
    patente: 'AC456EF',
    marca: 'Honda',
    modelo: 'CB250 Twister',
    anio: 2022,
    tipo: 1,
    dni: '27111222',
  },
] as const;

export const vehiculosFixture: readonly VehiculoResponse[] = [
  {
    id: VEHICULO_ID,
    clienteId: CLIENTE_JUAN_ID,
    patente: 'AB123CD',
    marca: 'Toyota',
    modelo: 'Corolla XEi',
    anio: 2021,
    tipo: 0,
    uso: 0,
    validadoDnrpa: true,
    activo: true,
  },
  {
    id: VEHICULO_BAJA_ID,
    clienteId: CLIENTE_JUAN_ID,
    patente: 'ABC123',
    marca: 'Toyota',
    modelo: 'Corolla XEi',
    anio: 2021,
    tipo: 0,
    uso: 0,
    validadoDnrpa: true,
    activo: false,
  },
];

export function crearEstadoVehiculos() {
  return structuredClone([...vehiculosFixture]);
}
