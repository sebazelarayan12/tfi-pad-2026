import { badgeEnum, etiquetaEnum } from '@nexa/api';
import { EstadoBadge } from '@nexa/ui';

interface PolizaEncabezadoProps {
  numero: string;
  estado: number;
}

export function PolizaEncabezado({ numero, estado }: PolizaEncabezadoProps) {
  const badge = badgeEnum('EstadoPoliza', estado);
  const etiqueta = etiquetaEnum('EstadoPoliza', estado);
  return (
    <div className="flex flex-wrap items-center gap-sp-12">
      <h1 className="break-all font-mono text-h2 text-text-primary">{numero}</h1>
      {badge === null ? (
        <span className="text-label text-text-secondary">{etiqueta}</span>
      ) : (
        <EstadoBadge estado={badge} texto={etiqueta} />
      )}
    </div>
  );
}
