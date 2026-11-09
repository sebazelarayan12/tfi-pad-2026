import { Button } from '@nexa/ui';

interface PaginacionCotizacionesProps {
  pagina: number;
  tamano: number;
  total: number;
  /** Filas de la página actual: con 0 el rango es `0 a 0`. */
  filas: number;
  cargando: boolean;
  onCambiar: (pagina: number) => void;
}

export function PaginacionCotizaciones({
  pagina,
  tamano,
  total,
  filas,
  cargando,
  onCambiar,
}: PaginacionCotizacionesProps) {
  const desde = filas === 0 ? 0 : (pagina - 1) * tamano + 1;
  const hasta = filas === 0 ? 0 : desde + filas - 1;

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-sp-16">
      <p className="text-body-sm text-text-secondary">
        {`Mostrando ${desde} a ${hasta} de ${total} cotizaciones`}
      </p>
      <div className="flex gap-sp-8">
        <Button
          label="Anterior"
          variant="secondary"
          size="s"
          disabled={cargando || pagina <= 1}
          onClick={() => onCambiar(pagina - 1)}
        />
        <Button
          label="Siguiente"
          variant="secondary"
          size="s"
          disabled={cargando || pagina * tamano >= total}
          onClick={() => onCambiar(pagina + 1)}
        />
      </div>
    </nav>
  );
}
