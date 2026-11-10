import { expectTypeOf } from 'vitest';
import {
  modificarCliente,
  type ApiClient,
  type ClienteModificacionRequest,
  type ClienteResumenResponse,
  type CuotaCuentaCliente,
  type CuotaResponse,
} from '../index';

declare const api: ApiClient;
declare const cuerpo: ClienteModificacionRequest;

expectTypeOf<keyof ClienteResumenResponse>().toEqualTypeOf<
  | 'id'
  | 'dni'
  | 'nombre'
  | 'apellido'
  | 'email'
  | 'telefono'
  | 'activo'
  | 'validadoRenaper'
  | 'cantidadVehiculos'
  | 'cantidadPolizasActivas'
>();
expectTypeOf<CuotaCuentaCliente>().toEqualTypeOf<CuotaResponse>();

modificarCliente(api, 'id', {
  ...cuerpo,
  // @ts-expect-error CU05 no permite modificar el DNI del cliente.
  dni: '30123456',
});
modificarCliente(api, 'id', {
  ...cuerpo,
  // @ts-expect-error Los campos de identidad de Renaper no son editables mediante CU05.
  nombre: 'Juan Carlos',
});
modificarCliente(api, 'id', {
  ...cuerpo,
  // @ts-expect-error El estado de validación depende de Renaper, no de la edición de contacto.
  validadoRenaper: true,
});
