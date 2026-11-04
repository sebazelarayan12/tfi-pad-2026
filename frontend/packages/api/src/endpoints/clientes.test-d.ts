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
  'id' | 'dni' | 'nombre' | 'apellido' | 'email' | 'telefono' | 'activo'
>();
expectTypeOf<CuotaCuentaCliente>().toEqualTypeOf<CuotaResponse>();

modificarCliente(api, 'id', {
  ...cuerpo,
  // @ts-expect-error CU05 never changes a client's DNI.
  dni: '30123456',
});
modificarCliente(api, 'id', {
  ...cuerpo,
  // @ts-expect-error Renaper identity fields are not writable in CU05.
  nombre: 'Juan Carlos',
});
modificarCliente(api, 'id', {
  ...cuerpo,
  // @ts-expect-error Validation status belongs to Renaper, not contact editing.
  validadoRenaper: true,
});
