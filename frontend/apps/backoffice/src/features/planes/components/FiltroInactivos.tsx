export function FiltroInactivos({
  mostrar,
  onCambiar,
}: {
  mostrar: boolean;
  onCambiar: (mostrar: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-sp-8 text-body-sm text-text-primary">
      <input
        type="checkbox"
        checked={mostrar}
        onChange={(event) => onCambiar(event.target.checked)}
      />
      Mostrar inactivos
    </label>
  );
}
