import { Input } from '@nexa/ui';
import type { UseFormRegisterReturn } from 'react-hook-form';

export function AntiguedadMaximaField({
  campo,
  error,
}: {
  campo: UseFormRegisterReturn<'antiguedadMaxima'>;
  error?: string;
}) {
  return (
    <div className="relative">
      <Input
        {...campo}
        label="Antigüedad máxima"
        inputMode="numeric"
        className="pr-16"
        error={Boolean(error)}
        helper={error ?? 'Dejalo vacío para sin límite.'}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-sp-12 top-sp-32 text-body text-text-secondary"
      >
        años
      </span>
    </div>
  );
}
