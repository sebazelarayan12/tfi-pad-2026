import { Button } from '@nexa/ui';
import { IdentificationCardIcon } from '@phosphor-icons/react/dist/csr/IdentificationCard';
import type { Ref } from 'react';

interface AccionRenaperProps {
  habilitado: boolean;
  consultando: boolean;
  onValidar: () => void;
  /** Contenedor del botón: el botón de `@nexa/ui` no recibe `ref`, así que el foco se devuelve desde acá. */
  contenedor?: Ref<HTMLDivElement>;
}

/** Botón "Validar en Renaper" junto al DNI (B4 §3, fila 1). */
export function AccionRenaper({
  habilitado,
  consultando,
  onValidar,
  contenedor,
}: AccionRenaperProps) {
  return (
    <div ref={contenedor} className="flex items-end sm:pb-[22px]">
      <Button
        label="Validar en Renaper"
        variant="secondary"
        icon={<IdentificationCardIcon size={20} />}
        disabled={!habilitado || consultando}
        aria-busy={consultando}
        onClick={onValidar}
      />
    </div>
  );
}
