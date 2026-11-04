export function traducirMensajeValidacion(mensaje: string, _campo: string): string {
  if (!mensaje.startsWith('The ')) return mensaje;
  if (/^The .+ field is required\.$/.test(mensaje)) return 'Este campo es obligatorio.';
  if (/^The .+ field is not a valid e-mail address\.$/.test(mensaje)) {
    return 'Ingresá un email válido.';
  }
  const largo =
    /^The field .+ must be a string or array type with a maximum length of '(\d+)'\.$/.exec(
      mensaje,
    );
  if (largo) return `Supera el largo máximo de ${largo[1]} caracteres.`;
  return 'Revisá este campo.';
}
