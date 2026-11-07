import { Button } from '@nexa/ui';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { useId } from 'react';

export function BotonCotizar({
  cotizando,
  habilitado,
  onCotizar,
}: {
  cotizando: boolean;
  habilitado: boolean;
  onCotizar: () => void;
}) {
  return (
    <Button
      label={cotizando ? 'Calculando planes…' : 'Cotizar'}
      disabled={!habilitado || cotizando}
      aria-busy={cotizando}
      onClick={onCotizar}
    />
  );
}

export function ContinuarAEmision({
  habilitado,
  onContinuar,
}: {
  habilitado: boolean;
  onContinuar: () => void;
}) {
  const idAyuda = useId();
  return (
    <div className="flex flex-wrap items-center justify-end gap-sp-12">
      {!habilitado ? (
        <p id={idAyuda} className="text-body-sm text-text-secondary">
          Seleccioná un plan para continuar
        </p>
      ) : null}
      <Button
        label="Continuar a emisión"
        icon={<ArrowRightIcon size={16} />}
        disabled={!habilitado}
        aria-disabled={!habilitado}
        aria-describedby={!habilitado ? idAyuda : undefined}
        onClick={onContinuar}
      />
    </div>
  );
}
