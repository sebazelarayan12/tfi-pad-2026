// Alfabeto sin caracteres ambiguos (0 O 1 l I) para que la contraseña se lea y se dicte sin errores.
const MAYUSCULAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const MINUSCULAS = 'abcdefghijkmnopqrstuvwxyz';
const DIGITOS = '23456789';
const SIMBOLOS = '!@#$%&*-_=+?';
const TODOS = MAYUSCULAS + MINUSCULAS + DIGITOS + SIMBOLOS;

export const LARGO_PASSWORD_TEMPORAL = 16;

const RANGO_UINT32 = 0x100000000;

/** Entero uniforme en [0, max) sin sesgo de módulo: descarta lo que cae fuera del último múltiplo. */
function enteroAleatorio(max: number): number {
  const limite = Math.floor(RANGO_UINT32 / max) * max;
  const buffer = new Uint32Array(1);
  for (;;) {
    globalThis.crypto.getRandomValues(buffer);
    const valor = buffer[0] ?? 0;
    if (valor < limite) return valor % max;
  }
}

function caracterDe(alfabeto: string): string {
  return alfabeto.charAt(enteroAleatorio(alfabeto.length));
}

/**
 * Contraseña temporal para el alta de un empleado (D-B24-02, RV-D18): 16 caracteres con al menos una
 * mayúscula, una minúscula, un dígito y un símbolo. Solo usa `crypto.getRandomValues`.
 */
export function generarPasswordTemporal(): string {
  const caracteres = [
    caracterDe(MAYUSCULAS),
    caracterDe(MINUSCULAS),
    caracterDe(DIGITOS),
    caracterDe(SIMBOLOS),
  ];
  while (caracteres.length < LARGO_PASSWORD_TEMPORAL) caracteres.push(caracterDe(TODOS));

  // Fisher-Yates: las posiciones de las cuatro clases obligatorias no son predecibles.
  for (let i = caracteres.length - 1; i > 0; i -= 1) {
    const j = enteroAleatorio(i + 1);
    const actual = caracteres[i] as string;
    caracteres[i] = caracteres[j] as string;
    caracteres[j] = actual;
  }
  return caracteres.join('');
}
