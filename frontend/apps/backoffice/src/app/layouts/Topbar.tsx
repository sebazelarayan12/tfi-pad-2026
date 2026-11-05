import type { ReactNode } from 'react';

export interface TopbarProps {
  titulo?: string;
  buscadorPlaceholder?: string;
  onBuscar?: (query: string) => void;
  onNotificaciones?: () => void;
  accion?: ReactNode;
}

const PLACEHOLDER_BUSCADOR = 'Buscar cliente o póliza';

function BellIcon() {
  return (
    <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M221.8 175.94c-5.55-9.56-13.8-36.61-13.8-71.94a80 80 0 1 0-160 0c0 35.34-8.26 62.38-13.81 71.94A16 16 0 0 0 48 200h40.81a40 40 0 0 0 78.38 0H208a16 16 0 0 0 13.8-24.06ZM128 216a24 24 0 0 1-22.62-16h45.24A24 24 0 0 1 128 216Zm-80-32c7.7-13.24 16-43.92 16-80a64 64 0 1 1 128 0c0 36.05 8.28 66.73 16 80Z" />
    </svg>
  );
}

export function Topbar({
  titulo,
  buscadorPlaceholder = PLACEHOLDER_BUSCADOR,
  onBuscar,
  onNotificaciones,
  accion,
}: TopbarProps) {
  return (
    <header className="flex h-16 items-center gap-sp-16">
      {titulo ? <h2 className="text-h2 text-text-primary">{titulo}</h2> : null}
      <div className="flex-1" />
      <form
        role="search"
        aria-label="Buscar en el panel"
        className="w-[280px]"
        onSubmit={(evento) => {
          evento.preventDefault();
          const datos = new FormData(evento.currentTarget);
          onBuscar?.(String(datos.get('q') ?? ''));
        }}
      >
        <label htmlFor="buscador-topbar" className="sr-only">
          {buscadorPlaceholder}
        </label>
        <input
          id="buscador-topbar"
          name="q"
          type="search"
          placeholder={buscadorPlaceholder}
          className="h-9 w-full rounded-input border border-border-strong bg-surface-panel px-sp-12 text-text-primary"
        />
      </form>
      <button
        type="button"
        aria-label="Notificaciones"
        onClick={onNotificaciones}
        className="flex h-9 w-9 items-center justify-center rounded-pill border border-border-strong bg-surface-panel text-text-primary"
      >
        <BellIcon />
      </button>
      {accion}
    </header>
  );
}
