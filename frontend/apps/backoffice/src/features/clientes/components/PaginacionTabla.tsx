import { Button } from '@nexa/ui';
import { TAMANO_PAGINA } from '../api/useClientes';

interface Props {
  pagina: number;
  total: number | undefined;
  cargando: boolean;
  onCambiar: (pagina: number) => void;
}
export function PaginacionTabla({ pagina, total, cargando, onCambiar }: Props) {
  const rango =
    cargando || total === undefined
      ? '—'
      : total === 0
        ? '0-0 de 0'
        : `${(pagina - 1) * TAMANO_PAGINA + 1}-${Math.min(pagina * TAMANO_PAGINA, total)} de ${total}`;
  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-between gap-sp-16 text-body-sm text-text-secondary"
    >
      <span className="tabular-nums">{rango}</span>
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
          disabled={cargando || total === undefined || pagina * TAMANO_PAGINA >= total}
          onClick={() => onCambiar(pagina + 1)}
        />
      </div>
    </nav>
  );
}
