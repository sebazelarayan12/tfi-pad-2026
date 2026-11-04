function decodificarBase64Url(segmento: string): string {
  const base64 = segmento.replace(/-/g, '+').replace(/_/g, '/');
  const relleno = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binario = atob(relleno);
  return new TextDecoder().decode(Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0)));
}

/**
 * Lee el claim `email` del JWT SIN verificar la firma: solo sirve para mostrarlo.
 * La autorización real la hace el back. Nunca lanza.
 */
export function leerEmailDelToken(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (payload === undefined) return null;
    const claims: unknown = JSON.parse(decodificarBase64Url(payload));
    if (typeof claims !== 'object' || claims === null || !('email' in claims)) return null;
    return typeof claims.email === 'string' ? claims.email : null;
  } catch {
    return null;
  }
}
