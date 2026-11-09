export function TogglePlan({
  activo,
  onClick,
  disabled,
}: {
  activo: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label="Activo"
      aria-checked={activo}
      onClick={onClick}
      disabled={disabled}
      className="relative z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-input focus-visible:outline focus-visible:outline-2 focus-visible:outline-action-primary disabled:opacity-50"
    >
      <span
        aria-hidden="true"
        className={`flex h-6 w-10 items-center rounded-full p-1 ${activo ? 'justify-end bg-text-primary' : 'justify-start bg-border-strong'}`}
      >
        <span className="h-4 w-4 rounded-full bg-surface-panel" />
      </span>
    </button>
  );
}
