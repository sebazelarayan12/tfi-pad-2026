import { Chip, Input } from '@nexa/ui';

interface Props {
  valor: string;
  total: number | undefined;
  cargando: boolean;
  onBuscar: (valor: string) => void;
}

/** El input conserva el foco; el hook de búsqueda controla el debounce de las requests. */
export function FiltrosClientes({ valor, total, cargando, onBuscar }: Props) {
  const contador =
    cargando || total === undefined ? '—' : `${total} ${total === 1 ? 'cliente' : 'clientes'}`;
  return (
    <div className="flex items-center gap-sp-12">
      <div className="min-w-0 flex-1">
        <Input
          label="Buscar por DNI o apellido"
          name="busquedaClientes"
          type="search"
          autoComplete="off"
          maxLength={100}
          value={valor}
          onChange={(evento) => onBuscar(evento.target.value)}
          placeholder="Ej. 30.512.468"
          helper="Buscar por DNI completo o apellido."
        />
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" className="shrink-0">
        <Chip tipo="neutro" label={contador} />
      </div>
    </div>
  );
}
