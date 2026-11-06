import { describe, expect, it } from 'vitest';

import { cobroCajaSchema } from './cobroCaja';

describe('cobroCajaSchema', () => {
  it('rechaza una lista vacía con el mensaje del back', () => {
    const resultado = cobroCajaSchema.safeParse({ cuotaIds: [] });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe('Debe indicar al menos una cuota.');
    }
  });

  it('acepta una cuota', () => {
    expect(cobroCajaSchema.safeParse({ cuotaIds: ['cuota-1'] }).success).toBe(true);
  });
});
