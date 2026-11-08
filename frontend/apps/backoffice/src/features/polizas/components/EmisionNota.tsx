import { AlertaError } from '@nexa/ui';

export function EmisionNota({ error }: { error: string | undefined }) {
  return (
    <>
      <p className="rounded-card border border-border-hairline bg-surface-subtle p-sp-16 text-body-sm text-text-secondary">
        La póliza nace Pendiente y pasa a Vigente al pagarse la cuota 1.
      </p>
      {error ? <AlertaError>{error}</AlertaError> : null}
    </>
  );
}
