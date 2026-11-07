import { Button } from '@nexa/ui';
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/csr/ShieldCheck';

export function AccionesEmision({
  habilitada,
  emitiendo,
  cargando = false,
  onCancelar,
}: {
  habilitada: boolean;
  emitiendo: boolean;
  cargando?: boolean;
  onCancelar: () => void;
}) {
  return (
    <div className="flex flex-col gap-sp-8">
      <Button
        label="Emitir póliza"
        type="submit"
        icon={<ShieldCheckIcon size={18} />}
        disabled={!habilitada}
        aria-disabled={!habilitada}
        aria-busy={emitiendo}
      />
      <Button
        label="Cancelar"
        variant="secondary"
        disabled={cargando || emitiendo}
        onClick={onCancelar}
      />
      <p role="status" className="sr-only">
        {emitiendo ? 'Emitiendo póliza…' : ''}
      </p>
    </div>
  );
}
