export function descargarTextoComoArchivo(nombre: string, texto: string): void {
  const enlace = document.createElement('a');
  const url = URL.createObjectURL(new Blob([texto], { type: 'text/plain' }));
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  try {
    enlace.click();
  } finally {
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
