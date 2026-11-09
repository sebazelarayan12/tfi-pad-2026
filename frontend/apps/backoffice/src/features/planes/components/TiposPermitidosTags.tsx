import { Chip } from '@nexa/ui';

export function TiposPermitidosTags({ tipos }: { tipos: string }) {
  return (
    <span className="flex flex-wrap gap-sp-4">
      {tipos
        .split(',')
        .map((tipo) => tipo.trim())
        .filter(Boolean)
        .map((tipo) => (
          <Chip key={tipo} tipo="neutro" label={tipo} />
        ))}
    </span>
  );
}
