import { formatearFechaHora } from '@nexa/api';
import { CalendarBlankIcon } from '@phosphor-icons/react/dist/csr/CalendarBlank';

export function VigenciaCotizacion({
  fechaVencimiento,
  vigente,
}: {
  fechaVencimiento: string;
  vigente: boolean;
}) {
  const [fecha] = formatearFechaHora(fechaVencimiento).split(' ');
  return (
    <p aria-live="polite" className="flex items-center gap-sp-8 text-body-sm text-text-secondary">
      <CalendarBlankIcon aria-hidden="true" size={16} />
      {vigente ? 'Válida hasta el ' : 'Vencida el '}
      {fecha}
    </p>
  );
}
