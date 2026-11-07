import { ApiError } from '@nexa/api';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { mensajeDniRenaper, resultadoRenaper } from './textosRenaper';
import { WidgetValidacionRenaper } from './WidgetValidacionRenaper';

const http = (status: number, codigo?: string) =>
  new ApiError({ kind: 'http', status, codigo: codigo ?? null });

describe('resultadoRenaper', () => {
  it('distingue vigente, fallecido y sin consulta', () => {
    expect(resultadoRenaper({ estado: 'VIGENTE' }, null)).toEqual({ tipo: 'vigente' });
    expect(resultadoRenaper({ estado: 'FALLECIDO' }, null)).toEqual({ tipo: 'fallecido' });
    expect(resultadoRenaper(undefined, null)).toEqual({ tipo: 'inicial' });
  });

  it('solo el 404 con PERSONA_NO_ENCONTRADA es "no existe"', () => {
    expect(resultadoRenaper(undefined, http(404, 'PERSONA_NO_ENCONTRADA'))).toEqual({
      tipo: 'no-existe',
    });
    expect(resultadoRenaper(undefined, http(404))).toEqual({ tipo: 'caido' });
    expect(resultadoRenaper(undefined, http(400))).toEqual({ tipo: 'formato' });
    expect(resultadoRenaper(undefined, http(502))).toEqual({ tipo: 'caido' });
    expect(resultadoRenaper(undefined, new ApiError({ kind: 'red', status: 0 }))).toEqual({
      tipo: 'caido',
    });
  });

  it('solo "no existe" y "formato" escriben en el campo DNI', () => {
    expect(mensajeDniRenaper({ tipo: 'no-existe' })).toContain('no existe en Renaper');
    expect(mensajeDniRenaper({ tipo: 'formato' })).toBe('El DNI debe tener 8 dígitos.');
    expect(mensajeDniRenaper({ tipo: 'caido' })).toBeUndefined();
  });
});

describe('WidgetValidacionRenaper', () => {
  it('con un fallecido usa el badge de error con el texto Fallecido', () => {
    render(<WidgetValidacionRenaper resultado={{ tipo: 'fallecido' }} />);
    expect(screen.getAllByText('Fallecido').length).toBeGreaterThan(0);
    expect(screen.queryByText('Validado')).toBeNull();
  });

  it('los errores se muestran con role alert y sin datos de persona', () => {
    render(<WidgetValidacionRenaper resultado={{ tipo: 'caido' }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Renaper no responde.');
    expect(screen.queryByText('Fecha de validación')).toBeNull();
  });
});
