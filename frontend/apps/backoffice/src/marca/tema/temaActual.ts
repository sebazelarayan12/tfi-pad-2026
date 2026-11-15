// Modo claro/oscuro de la web pública. El atributo `data-tema` del `<html>` es la fuente de verdad:
// lo pone el script de `index.html` antes de pintar (sin parpadeo) y lo cambia el interruptor.

export type Tema = 'claro' | 'oscuro';

const ATRIBUTO = 'data-tema';
const CLAVE_GUARDADA = 'nexa-tema';
const COLOR_BARRA: Record<Tema, string> = { claro: '#ffffff', oscuro: '#0b1f4b' };

const oyentes = new Set<() => void>();

export function leerTema(): Tema {
  if (typeof document === 'undefined') return 'claro';
  return document.documentElement.getAttribute(ATRIBUTO) === 'oscuro' ? 'oscuro' : 'claro';
}

export function suscribirTema(avisar: () => void): () => void {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

/** Aplica el tema, lo recuerda en este navegador y avisa a los componentes que lo leen. */
export function cambiarTema(tema: Tema): void {
  document.documentElement.setAttribute(ATRIBUTO, tema);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_BARRA[tema]);
  try {
    localStorage.setItem(CLAVE_GUARDADA, tema);
  } catch {
    // Sin almacenamiento (modo privado o bloqueado): el tema vale solo para esta visita.
  }
  oyentes.forEach((avisar) => avisar());
}
