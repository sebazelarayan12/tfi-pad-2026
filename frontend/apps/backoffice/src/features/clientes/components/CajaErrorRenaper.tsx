import { AlertaError } from '@nexa/ui';

/** Caja del rail cuando la consulta falla (B4 §7). Se monta en el momento del error. */
export function CajaErrorRenaper({ mensaje }: { mensaje: string }) {
  return <AlertaError>{mensaje}</AlertaError>;
}
