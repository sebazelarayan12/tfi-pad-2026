const MAX_BYTES_RENDICION = 5 * 1024 * 1024;
const NOMBRE_RENDICION = /^[A-Za-z0-9._-]{1,90}$/;

export function validarArchivoRendicion(archivo: File): string | null {
  if (!/\.txt$/i.test(archivo.name)) return 'Elegí un archivo .txt.';
  if (archivo.size > MAX_BYTES_RENDICION) return 'El archivo supera el máximo de 5 MB.';
  if (!NOMBRE_RENDICION.test(archivo.name)) {
    return 'El nombre solo puede tener letras sin acento, números, ".", "-" o "_" (máximo 90 caracteres).';
  }
  return null;
}
