/** Única clave que la web pública escribe en `sessionStorage` (FC12, DN-W6-9). */
const CLAVE_NUMERO_PAGO = 'nexa.publico.numeroPago';

/**
 * Guarda el `numeroPago` antes de salir a la pasarela para que W6 lo lea al volver (W4 D8).
 * Nunca se guarda el DNI ni el número de póliza (FC12). Si el navegador bloquea el storage,
 * el pago sigue igual y W6 queda sin el número (DN-W6-6).
 */
export function guardarNumeroPagoEnCurso(numeroPago: string): void {
  try {
    sessionStorage.setItem(CLAVE_NUMERO_PAGO, numeroPago);
  } catch {
    // DN-W6-6: falla en silencio, el flujo continúa.
  }
}

/** Lee el `numeroPago` guardado por W4; `null` si no hay o si el storage no está disponible. */
export function leerNumeroPagoEnCurso(): string | null {
  try {
    return sessionStorage.getItem(CLAVE_NUMERO_PAGO);
  } catch {
    return null;
  }
}
