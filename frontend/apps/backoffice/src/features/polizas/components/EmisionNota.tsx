import { AlertaError } from '@nexa/ui';
import { InfoIcon } from '@phosphor-icons/react/dist/csr/Info';

export function EmisionNota({ error }: { error: string | undefined }) {
  return (
    <>
      <p className="flex items-start gap-sp-12 rounded-card bg-accent-lime-soft p-sp-16 text-body-sm text-text-primary">
        <InfoIcon aria-hidden="true" size={16} className="shrink-0" />
        <span>La póliza nace Pendiente y pasa a Vigente al pagarse la cuota 1.</span>
      </p>
      {error ? <AlertaError>{error}</AlertaError> : null}
    </>
  );
}
