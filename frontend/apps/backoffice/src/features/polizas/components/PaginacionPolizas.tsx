import { Button } from '@nexa/ui';

interface PaginacionPolizasProps {
  pagina: number;
  tamano: number;
  total: number;
  /** Filas de la página actual: con 0 (fuera de rango) el rango es `0-0`. */
  filas: number;
  cargando: boolean;
  onCambiar: (pagina: number) => void;
}

const CLASE_DESHABILITADO = 'aria-disabled:cursor-not-allowed aria-disabled:opacity-50';

export function PaginacionPolizas({
  pagina,
  tamano,
  total,
  filas,
  cargando,
  onCambiar,
}: PaginacionPolizasProps) {
  const desde = filas === 0 ? 0 : (pagina - 1) * tamano + 1;
  const hasta = filas === 0 ? 0 : desde + filas - 1;
  const anteriorDeshabilitado = cargando || pagina <= 1;
  const siguienteDeshabilitado = cargando || pagina * tamano >= total;

  return (
    <nav aria-label="Paginación" className="flex items-center justify-end gap-sp-16">
      <p className="text-body-sm text-text-secondary">{`${desde}-${hasta} de ${total}`}</p>
      <Button
        label="Anterior"
        variant="secondary"
        size="s"
        aria-disabled={anteriorDeshabilitado}
        className={CLASE_DESHABILITADO}
        onClick={() => {
          if (!anteriorDeshabilitado) onCambiar(pagina - 1);
        }}
      />
      <Button
        label="Siguiente"
        variant="secondary"
        size="s"
        aria-disabled={siguienteDeshabilitado}
        className={CLASE_DESHABILITADO}
        onClick={() => {
          if (!siguienteDeshabilitado) onCambiar(pagina + 1);
        }}
      />
    </nav>
  );
}
