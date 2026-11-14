import { useTema } from './tema/useTema';

const NOMBRE = 'Nexa Seguros';
// Tamaño real de los archivos (`public/img/logo-nexa-seguros*.png`), para reservar el espacio.
const LOGO_COLOR = { src: '/img/logo-nexa-seguros.png', ancho: 469 };
const LOGO_BLANCO = { src: '/img/logo-nexa-seguros-blanco.png', ancho: 477 };
const ALTO = 160;

interface LogoMarcaProps {
  className?: string;
  /** Repetición del logo que ya se anunció (por ejemplo en el pie): el lector la saltea. */
  decorativo?: boolean;
  /** Fuerza el wordmark blanco (fondos oscuros en los dos modos, como el pie). */
  blanco?: boolean;
}

/** Logo completo de Nexa Seguros: escudo con la N y wordmark, blanco en modo oscuro. */
export function LogoMarca({
  className = 'h-9 w-auto',
  decorativo = false,
  blanco = false,
}: LogoMarcaProps) {
  const { tema } = useTema();
  const logo = blanco || tema === 'oscuro' ? LOGO_BLANCO : LOGO_COLOR;
  return (
    <img
      src={logo.src}
      alt={decorativo ? '' : NOMBRE}
      width={logo.ancho}
      height={ALTO}
      className={className}
    />
  );
}
