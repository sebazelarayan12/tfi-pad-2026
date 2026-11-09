export function TiposPermitidosTags({ tipos }: { tipos: string }) {
  return (
    <span>
      {tipos
        .split(',')
        .map((tipo) => tipo.trim())
        .join(', ')}
    </span>
  );
}
