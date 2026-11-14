const NOMBRE = 'Nexa Seguros';
// Tamaño real del archivo (`public/img/logo-nexa-seguros.png`), para reservar el espacio.
const ANCHO = 469;
const ALTO = 160;

interface LogoMarcaProps {
  className?: string;
  /** Repetición del logo que ya se anunció (por ejemplo en el pie): el lector la saltea. */
  decorativo?: boolean;
}

/** Logo completo de Nexa Seguros: escudo con la N y wordmark. */
export function LogoMarca({ className = 'h-9 w-auto', decorativo = false }: LogoMarcaProps) {
  return (
    <img
      src="/img/logo-nexa-seguros.png"
      alt={decorativo ? '' : NOMBRE}
      width={ANCHO}
      height={ALTO}
      className={className}
    />
  );
}
