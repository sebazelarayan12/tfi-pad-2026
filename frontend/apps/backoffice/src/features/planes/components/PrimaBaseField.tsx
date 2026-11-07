import { formatearImporte, parseImporteEsAR } from '@nexa/api';
import { Input } from '@nexa/ui';
import { Controller, type Control } from 'react-hook-form';
import type { PlanFormValidado, PlanFormValues } from '../types/planes';

const sinSimbolo = (valor: string) => valor.replace(/^(-?)\$\s*/, '$1');

export function PrimaBaseField({
  control,
}: {
  control: Control<PlanFormValues, unknown, PlanFormValidado>;
}) {
  return (
    <Controller
      control={control}
      name="primaBase"
      render={({ field, fieldState }) => (
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-sp-12 top-sp-32 text-body text-text-secondary"
          >
            $
          </span>
          <Input
            {...field}
            value={sinSimbolo(field.value)}
            label="Prima base mensual"
            inputMode="decimal"
            className="pl-sp-24"
            error={fieldState.invalid}
            helper={fieldState.error?.message ?? 'El cambio no afecta pólizas ya emitidas.'}
            onBlur={() => {
              const valor = parseImporteEsAR(field.value);
              if (valor !== null) field.onChange(formatearImporte(valor));
              field.onBlur();
            }}
          />
        </div>
      )}
    />
  );
}
