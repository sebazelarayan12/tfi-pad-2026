import { expect, it } from 'vitest';
import { badgeEnum, etiquetaEnum, obtenerEnum } from '@nexa/api';
import { tablas } from '../../src/enums/dominios';

// Cantidad de valores por dominio según la ficha T-10 §7. Si se agrega o quita una entrada
// en `dominios.ts`, este test obliga a actualizar la ficha y la tabla de abajo.
const CANTIDAD_POR_DOMINIO = {
  EstadoPoliza: 5,
  EstadoPolizaPublico: 5,
  EstadoCuota: 4,
  EstadoCuotaPublico: 4,
  EstadoPago: 3,
  MedioPago: 3,
  EstadoFactura: 2,
  TipoVehiculo: 3,
  UsoVehiculo: 2,
  OrigenCotizacion: 3,
  Sexo: 3,
  Rol: 2,
} as const;

it('hay exactamente los doce dominios de la ficha', () => {
  expect(Object.keys(tablas).sort()).toEqual(Object.keys(CANTIDAD_POR_DOMINIO).sort());
});

it.each(Object.entries(CANTIDAD_POR_DOMINIO))(
  '%s tiene %i valores, sin repetidos',
  (dominio, cantidad) => {
    const valores = tablas[dominio as keyof typeof tablas].map((entrada) => entrada.valor);
    expect(valores).toHaveLength(cantidad);
    expect(new Set(valores).size).toBe(cantidad);
  },
);

it.each([
  ['EstadoPoliza', 0, 'Pendiente', 'Pendiente', 'Pendiente'],
  ['EstadoPoliza', 1, 'Vigente', 'Vigente', 'Vigente'],
  ['EstadoPoliza', 2, 'Suspendida', 'Suspendida', 'Suspendida'],
  ['EstadoPoliza', 3, 'Cancelada', 'Cancelada', 'Cancelada'],
  ['EstadoPoliza', 4, 'Vencida', 'Vencida', 'Vencida'],
  ['EstadoPolizaPublico', 'PENDIENTE', 'PENDIENTE', 'Pendiente', 'Pendiente'],
  ['EstadoPolizaPublico', 'VIGENTE', 'VIGENTE', 'Vigente', 'Vigente'],
  ['EstadoPolizaPublico', 'SUSPENDIDA', 'SUSPENDIDA', 'Suspendida', 'Suspendida'],
  ['EstadoPolizaPublico', 'CANCELADA', 'CANCELADA', 'Cancelada', 'Cancelada'],
  ['EstadoPolizaPublico', 'VENCIDA', 'VENCIDA', 'Vencida', 'Vencida'],
  ['EstadoCuota', 0, 'Pendiente', 'Pendiente', 'Pendiente'],
  ['EstadoCuota', 1, 'Vencida', 'Vencida', 'Vencida'],
  ['EstadoCuota', 2, 'Pagada', 'Pagada', 'Pagada'],
  ['EstadoCuota', 3, 'Anulada', 'Anulada', 'Anulada'],
  ['EstadoCuotaPublico', 'PENDIENTE', 'PENDIENTE', 'Pendiente', 'Pendiente'],
  ['EstadoCuotaPublico', 'VENCIDA', 'VENCIDA', 'Vencida', 'Vencida'],
  ['EstadoCuotaPublico', 'PAGADA', 'PAGADA', 'Pagada', 'Pagada'],
  ['EstadoCuotaPublico', 'ANULADA', 'ANULADA', 'Anulada', 'Anulada'],
  ['EstadoPago', 'PENDIENTE', 'PENDIENTE', 'Pendiente', null],
  ['EstadoPago', 'APROBADO', 'APROBADO', 'Aprobado', null],
  ['EstadoPago', 'RECHAZADO', 'RECHAZADO', 'Rechazado', null],
  ['MedioPago', 'PASARELA', 'PASARELA', 'Pasarela', null],
  ['MedioPago', 'PAGO_FACIL', 'PAGO_FACIL', 'Pago Fácil', null],
  ['MedioPago', 'CAJA', 'CAJA', 'Caja', null],
  ['EstadoFactura', 'PENDIENTE_CAE', 'PENDIENTE_CAE', 'Pendiente CAE', 'Pendiente CAE'],
  ['EstadoFactura', 'AUTORIZADA', 'AUTORIZADA', 'Autorizada', null],
  ['TipoVehiculo', 0, 'Auto', 'Auto', null],
  ['TipoVehiculo', 1, 'Moto', 'Moto', null],
  ['TipoVehiculo', 2, 'Camioneta', 'Camioneta', null],
  ['UsoVehiculo', 0, 'Particular', 'Particular', null],
  ['UsoVehiculo', 1, 'Comercial', 'Comercial', null],
  ['OrigenCotizacion', 0, 'Web', 'Web', null],
  ['OrigenCotizacion', 1, 'Panel', 'Panel', null],
  ['OrigenCotizacion', 2, 'Externo', 'Externo', null],
  ['Sexo', 'M', 'M', 'Masculino', null],
  ['Sexo', 'F', 'F', 'Femenino', null],
  ['Sexo', 'X', 'X', 'X', null],
  ['Rol', 'Administrador', 'Administrador', 'Administrador', null],
  ['Rol', 'Empleado', 'Empleado', 'Empleado', null],
] as const)('mapea %s con valor %s', (dominio, valor, literal, etiqueta, badge) => {
  expect(obtenerEnum(dominio, valor)).toEqual({ valor, literal, etiqueta, badge });
  expect(etiquetaEnum(dominio, valor)).toBe(etiqueta);
  expect(badgeEnum(dominio, valor)).toBe(badge);
});

it('distingue el valor 1 de póliza del valor 1 de cuota', () => {
  expect(obtenerEnum('EstadoPoliza', 1)?.literal).toBe('Vigente');
  expect(obtenerEnum('EstadoCuota', 1)?.literal).toBe('Vencida');
});

it('rechaza valores desconocidos o de un formato distinto al contrato', () => {
  expect(obtenerEnum('EstadoPoliza', '1')).toBeNull();
  expect(obtenerEnum('EstadoPoliza', 'VENCIDA')).toBeNull();
  expect(obtenerEnum('EstadoPolizaPublico', 4)).toBeNull();
  expect(obtenerEnum('EstadoPolizaPublico', 'vencida')).toBeNull();
  expect(etiquetaEnum('EstadoPoliza', 5)).toBe('—');
  expect(badgeEnum('EstadoPoliza', null)).toBeNull();
});
