import { isApiError } from '@nexa/api';

export function detalleEmision(error: unknown, respaldo: string) {
  return isApiError(error) && error.detail?.trim() ? error.detail : respaldo;
}
