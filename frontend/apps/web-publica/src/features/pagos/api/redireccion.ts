/** Sale del sitio hacia el checkout de la pasarela. Aislado para poder mockearlo en los tests. */
export function redirigirA(url: string): void {
  window.location.assign(url);
}
