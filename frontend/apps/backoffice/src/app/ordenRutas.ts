import type { RouteObject } from 'react-router-dom';

const esDinamico = (segmento: string) => segmento.startsWith(':') || segmento === '*';

function segmentos(path: string): string[] {
  return path.split('/').filter((segmento) => segmento !== '');
}

/** Recorre el árbol en orden y devuelve el path absoluto de cada ruta que declara `path`. */
function aplanar(rutas: ReadonlyArray<RouteObject>, base = ''): string[] {
  return rutas.flatMap((ruta) => {
    const actual = ruta.path === undefined ? base : `${base}/${ruta.path}`.replace(/\/+/g, '/');
    const propio = ruta.path === undefined ? [] : [actual];
    return [...propio, ...aplanar(ruta.children ?? [], actual)];
  });
}

/** `true` si la ruta dinámica `dinamica` también captura el path estático `estatica`. */
function capturaA(dinamica: string[], estatica: string[]): boolean {
  return (
    dinamica.length === estatica.length &&
    dinamica.some(esDinamico) &&
    dinamica.every((segmento, i) => esDinamico(segmento) || segmento === estatica[i])
  );
}

/**
 * FC14: una ruta estática debe ir antes que una dinámica que la captura
 * (`/clientes/nuevo` antes que `/clientes/:clienteId`).
 * Devuelve los paths estáticos que quedaron después de una dinámica que los tapa.
 */
export function validarOrdenRutas(rutas: ReadonlyArray<RouteObject>): string[] {
  const paths = aplanar(rutas);
  const errores: string[] = [];
  paths.forEach((path, indice) => {
    const partes = segmentos(path);
    if (partes.some(esDinamico)) return;
    const tapada = paths.slice(0, indice).some((anterior) => capturaA(segmentos(anterior), partes));
    if (tapada) errores.push(path);
  });
  return errores;
}
