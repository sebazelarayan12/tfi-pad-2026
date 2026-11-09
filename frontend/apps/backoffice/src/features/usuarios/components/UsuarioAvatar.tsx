interface UsuarioAvatarProps {
  nombre: string;
  apellido: string;
}

const inicial = (texto: string) => texto.trim().charAt(0).toUpperCase();

/** Iniciales de nombre y apellido; decorativo, el nombre completo ya está en la celda (B14 §12). */
export function UsuarioAvatar({ nombre, apellido }: UsuarioAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-label text-text-primary"
    >
      {inicial(nombre)}
      {inicial(apellido)}
    </span>
  );
}
