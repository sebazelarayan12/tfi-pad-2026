import type { EstadoBadgeValue } from './badges';

interface Entrada {
  valor: number | string;
  literal: string;
  etiqueta: string;
  badge: EstadoBadgeValue | null;
}

export const tablas = {
  EstadoPoliza: [
    { valor: 0, literal: 'Pendiente', etiqueta: 'Pendiente', badge: 'Pendiente' },
    { valor: 1, literal: 'Vigente', etiqueta: 'Vigente', badge: 'Vigente' },
    { valor: 2, literal: 'Suspendida', etiqueta: 'Suspendida', badge: 'Suspendida' },
    { valor: 3, literal: 'Cancelada', etiqueta: 'Cancelada', badge: 'Cancelada' },
    { valor: 4, literal: 'Vencida', etiqueta: 'Vencida', badge: 'Vencida' },
  ],
  EstadoPolizaPublico: [
    { valor: 'PENDIENTE', literal: 'PENDIENTE', etiqueta: 'Pendiente', badge: 'Pendiente' },
    { valor: 'VIGENTE', literal: 'VIGENTE', etiqueta: 'Vigente', badge: 'Vigente' },
    { valor: 'SUSPENDIDA', literal: 'SUSPENDIDA', etiqueta: 'Suspendida', badge: 'Suspendida' },
    { valor: 'CANCELADA', literal: 'CANCELADA', etiqueta: 'Cancelada', badge: 'Cancelada' },
    { valor: 'VENCIDA', literal: 'VENCIDA', etiqueta: 'Vencida', badge: 'Vencida' },
  ],
  EstadoCuota: [
    { valor: 0, literal: 'Pendiente', etiqueta: 'Pendiente', badge: 'Pendiente' },
    { valor: 1, literal: 'Vencida', etiqueta: 'Vencida', badge: 'Vencida' },
    { valor: 2, literal: 'Pagada', etiqueta: 'Pagada', badge: 'Pagada' },
    { valor: 3, literal: 'Anulada', etiqueta: 'Anulada', badge: 'Anulada' },
  ],
  EstadoCuotaPublico: [
    { valor: 'PENDIENTE', literal: 'PENDIENTE', etiqueta: 'Pendiente', badge: 'Pendiente' },
    { valor: 'VENCIDA', literal: 'VENCIDA', etiqueta: 'Vencida', badge: 'Vencida' },
    { valor: 'PAGADA', literal: 'PAGADA', etiqueta: 'Pagada', badge: 'Pagada' },
    { valor: 'ANULADA', literal: 'ANULADA', etiqueta: 'Anulada', badge: 'Anulada' },
  ],
  EstadoPago: [
    { valor: 'PENDIENTE', literal: 'PENDIENTE', etiqueta: 'Pendiente', badge: null },
    { valor: 'APROBADO', literal: 'APROBADO', etiqueta: 'Aprobado', badge: null },
    { valor: 'RECHAZADO', literal: 'RECHAZADO', etiqueta: 'Rechazado', badge: null },
  ],
  MedioPago: [
    { valor: 'PASARELA', literal: 'PASARELA', etiqueta: 'Pasarela', badge: null },
    { valor: 'PAGO_FACIL', literal: 'PAGO_FACIL', etiqueta: 'Pago Fácil', badge: null },
    { valor: 'CAJA', literal: 'CAJA', etiqueta: 'Caja', badge: null },
  ],
  EstadoFactura: [
    {
      valor: 'PENDIENTE_CAE',
      literal: 'PENDIENTE_CAE',
      etiqueta: 'Pendiente CAE',
      badge: 'Pendiente CAE',
    },
    { valor: 'AUTORIZADA', literal: 'AUTORIZADA', etiqueta: 'Autorizada', badge: null },
  ],
  TipoVehiculo: [
    { valor: 0, literal: 'Auto', etiqueta: 'Auto', badge: null },
    { valor: 1, literal: 'Moto', etiqueta: 'Moto', badge: null },
    { valor: 2, literal: 'Camioneta', etiqueta: 'Camioneta', badge: null },
  ],
  UsoVehiculo: [
    { valor: 0, literal: 'Particular', etiqueta: 'Particular', badge: null },
    { valor: 1, literal: 'Comercial', etiqueta: 'Comercial', badge: null },
  ],
  OrigenCotizacion: [
    { valor: 0, literal: 'Web', etiqueta: 'Web', badge: null },
    { valor: 1, literal: 'Panel', etiqueta: 'Panel', badge: null },
    { valor: 2, literal: 'Externo', etiqueta: 'Externo', badge: null },
  ],
  Sexo: [
    { valor: 'M', literal: 'M', etiqueta: 'Masculino', badge: null },
    { valor: 'F', literal: 'F', etiqueta: 'Femenino', badge: null },
    { valor: 'X', literal: 'X', etiqueta: 'X', badge: null },
  ],
  Rol: [
    { valor: 'Administrador', literal: 'Administrador', etiqueta: 'Administrador', badge: null },
    { valor: 'Empleado', literal: 'Empleado', etiqueta: 'Empleado', badge: null },
  ],
} as const satisfies Record<string, readonly Entrada[]>;

export type Dominio = keyof typeof tablas;
export type EntradaEnum<D extends Dominio> = (typeof tablas)[D][number];
type Valor<D extends Dominio> = EntradaEnum<D>['valor'];

export type EstadoPolizaNum = Valor<'EstadoPoliza'>;
export type EstadoCuotaNum = Valor<'EstadoCuota'>;
export type EstadoPagoStr = Valor<'EstadoPago'>;
export type MedioPagoStr = Valor<'MedioPago'>;
export type EstadoFacturaStr = Valor<'EstadoFactura'>;
export type EstadoPublicoStr = Valor<'EstadoPolizaPublico' | 'EstadoCuotaPublico'>;
