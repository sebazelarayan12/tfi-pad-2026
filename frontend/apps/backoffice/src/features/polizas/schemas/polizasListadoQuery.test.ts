import { describe, expect, it } from 'vitest';

import { leerFiltrosPolizas, escribirFiltrosPolizas } from './polizasListadoQuery';

describe('polizasListadoQuery', () => {
  it('query: estado inválido en la URL cae a Todas', () => {
    expect(leerFiltrosPolizas(new URLSearchParams('estado=Inexistente')).estado).toBeUndefined();
    expect(leerFiltrosPolizas(new URLSearchParams('estado=1')).estado).toBeUndefined();
    expect(leerFiltrosPolizas(new URLSearchParams('estado=vigente')).estado).toBeUndefined();
  });

  it('query: acepta el nombre de cada estado', () => {
    expect(leerFiltrosPolizas(new URLSearchParams('estado=Vigente')).estado).toBe('Vigente');
  });

  it('query: pagina < 1 cae a 1', () => {
    expect(leerFiltrosPolizas(new URLSearchParams('pagina=0')).pagina).toBe(1);
    expect(leerFiltrosPolizas(new URLSearchParams('pagina=-3')).pagina).toBe(1);
    expect(leerFiltrosPolizas(new URLSearchParams('pagina=abc')).pagina).toBe(1);
    expect(leerFiltrosPolizas(new URLSearchParams('pagina=2.5')).pagina).toBe(1);
    expect(leerFiltrosPolizas(new URLSearchParams('')).pagina).toBe(1);
  });

  it('query: lee una página válida', () => {
    expect(leerFiltrosPolizas(new URLSearchParams('pagina=4')).pagina).toBe(4);
  });

  it('escribir: omite estado en Todas y pagina en 1', () => {
    expect(escribirFiltrosPolizas({ pagina: 1 }).toString()).toBe('');
    expect(escribirFiltrosPolizas({ estado: 'Vigente', pagina: 3 }).toString()).toBe(
      'estado=Vigente&pagina=3',
    );
  });
});
