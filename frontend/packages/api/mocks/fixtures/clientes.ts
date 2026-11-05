import type { ClienteResponse, CuentaClienteResponse } from '../../src/dto/clientes';

export const CLIENTE_JUAN_ID = 'c1000000-0000-0000-0000-000000000001';
export const CLIENTE_LUCIA_ID = 'c1000000-0000-0000-0000-000000000002';
export const CLIENTE_INACTIVO_ID = 'c1000000-0000-0000-0000-000000000003';

/** Etiquetas de prueba: no son JWT ni credenciales de un entorno real. */
export const tokensMockClientes = {
  empleado: 'mock-clientes-empleado',
  administrador: 'mock-clientes-administrador',
  sinPermiso: 'mock-clientes-sin-rol',
  invalido: 'mock-clientes-invalido',
} as const;

export interface ClienteFixture {
  cliente: ClienteResponse;
  /** Escenario local para bloquear la baja con póliza Pendiente, Vigente o Suspendida. */
  tienePolizaActiva: boolean;
  cuenta: CuentaClienteResponse;
}

const juan: ClienteResponse = {
  id: CLIENTE_JUAN_ID,
  dni: '30123456',
  cuil: '20301234565',
  nombre: 'Juan Carlos',
  apellido: 'Pérez',
  fechaNacimiento: '1985-03-21',
  sexo: 'M',
  email: 'juan.perez@ejemplo.com',
  telefono: null,
  calle: 'San Martín',
  numero: '1234',
  localidad: 'San Miguel de Tucumán',
  provincia: 'Tucumán',
  codigoPostal: '4000',
  validadoRenaper: true,
  fechaValidacionRenaper: '2026-10-15T00:00:00',
  activo: true,
};

const lucia: ClienteResponse = {
  ...juan,
  id: CLIENTE_LUCIA_ID,
  dni: '45123456',
  cuil: '27451234564',
  nombre: 'Lucía',
  apellido: 'Fernández',
  // El ejemplo documentado de alta de una menor no representa un cliente persistido válido.
  fechaNacimiento: '1985-03-21',
  sexo: 'F',
  email: 'lucia.fernandez@ejemplo.com',
  telefono: '3815550123',
  calle: 'Rivadavia',
  numero: '456',
  localidad: 'Yerba Buena',
  codigoPostal: '4107',
  validadoRenaper: false,
  fechaValidacionRenaper: null,
};

const cuentaVacia: CuentaClienteResponse = {
  deudaVencida: 0,
  cuotaVencidaConRecargo: null,
  proximaCuota: null,
};

/** FC4: Juan Carlos Pérez y Lucía Fernández provienen de los ejemplos del contrato de clientes. */
export const clientesFixture: readonly ClienteFixture[] = [
  {
    cliente: juan,
    tienePolizaActiva: true,
    // DTO propuesto de cuenta; no reconstruye los fixtures de pólizas de otros dominios.
    cuenta: {
      deudaVencida: 12600,
      cuotaVencidaConRecargo: {
        id: 'f1000000-0000-0000-0000-000000000002',
        numero: 2,
        importe: 12000,
        recargo: 600,
        fechaVencimiento: '2026-10-10',
        estado: 1,
        fechaPago: null,
      },
      proximaCuota: {
        id: 'f1000000-0000-0000-0000-000000000003',
        numero: 3,
        importe: 12000,
        recargo: 0,
        fechaVencimiento: '2026-11-10',
        estado: 0,
        fechaPago: null,
      },
    },
  },
  { cliente: lucia, tienePolizaActiva: false, cuenta: cuentaVacia },
  {
    // Registro inactivo independiente para comprobar 404 y la unicidad del email.
    cliente: {
      ...juan,
      id: CLIENTE_INACTIVO_ID,
      dni: '30512468',
      email: 'inactivo@ejemplo.com',
      activo: false,
    },
    tienePolizaActiva: false,
    cuenta: cuentaVacia,
  },
];
