import { ApiError } from '@nexa/api';
import { describe, expect, it } from 'vitest';

import { reintentarSolo502 } from './usePrevisualizarRenaper';

const http = (status: number) => new ApiError({ kind: 'http', status });

describe('reintentarSolo502', () => {
  it('reintenta una sola vez y solo ante 502', () => {
    expect(reintentarSolo502(0, http(502))).toBe(true);
    expect(reintentarSolo502(1, http(502))).toBe(false);
  });

  it('no reintenta ante 4xx, 5xx distintos de 502 ni error de red', () => {
    for (const status of [400, 401, 403, 404, 500, 503]) {
      expect(reintentarSolo502(0, http(status))).toBe(false);
    }
    expect(reintentarSolo502(0, new ApiError({ kind: 'red', status: 0 }))).toBe(false);
    expect(reintentarSolo502(0, new Error('x'))).toBe(false);
  });
});
