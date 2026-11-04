import {
  createContext,
  useContext,
  useId,
  useMemo,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  /** `aria-label` del `tablist`. */
  label: string;
  items: ReadonlyArray<TabItem>;
  value: string;
  onValueChange: (id: string) => void;
  children?: ReactNode;
}

interface TabsContextValue {
  value: string;
  tabId: (id: string) => string;
  panelId: (id: string) => string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const TAB_BASE =
  'border-b-2 text-body-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary';
const TAB_ACTIVA = 'border-action-primary text-text-primary';
const TAB_INACTIVA = 'border-transparent text-text-secondary';

/**
 * Pestañas controladas con el patrón ARIA `tablist` / `tab` / `tabpanel`.
 * La selección cambia solo cuando cambia `value`; las flechas activan al moverse (D-T06-4).
 */
export function Tabs({ label, items, value, onValueChange, children }: TabsProps) {
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const contexto = useMemo<TabsContextValue>(
    () => ({
      value,
      tabId: (id) => `${baseId}-tab-${id}`,
      panelId: (id) => `${baseId}-panel-${id}`,
    }),
    [baseId, value],
  );

  const hayActiva = items.some((item) => item.id === value);

  function mover(indice: number) {
    const destino = items[indice];
    if (!destino) return;
    tabRefs.current[indice]?.focus();
    onValueChange(destino.id);
  }

  function onKeyDown(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const ultimo = items.length - 1;
    let destino: number | null = null;
    if (evento.key === 'ArrowRight') destino = indice === ultimo ? 0 : indice + 1;
    else if (evento.key === 'ArrowLeft') destino = indice === 0 ? ultimo : indice - 1;
    else if (evento.key === 'Home') destino = 0;
    else if (evento.key === 'End') destino = ultimo;
    if (destino === null) return;
    evento.preventDefault();
    mover(destino);
  }

  return (
    <TabsContext.Provider value={contexto}>
      <div role="tablist" aria-label={label} className="flex h-[30px] gap-sp-24">
        {items.map((item, indice) => {
          const seleccionada = item.id === value;
          const alcanzable = seleccionada || (!hayActiva && indice === 0);
          return (
            <button
              key={item.id}
              ref={(nodo) => {
                tabRefs.current[indice] = nodo;
              }}
              type="button"
              role="tab"
              id={contexto.tabId(item.id)}
              aria-selected={seleccionada}
              aria-controls={contexto.panelId(item.id)}
              tabIndex={alcanzable ? 0 : -1}
              onClick={() => onValueChange(item.id)}
              onKeyDown={(evento) => onKeyDown(evento, indice)}
              className={`${TAB_BASE} ${seleccionada ? TAB_ACTIVA : TAB_INACTIVA}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {children}
    </TabsContext.Provider>
  );
}

export interface TabPanelProps {
  /** `id` de la pestaña (`TabItem.id`) a la que pertenece el panel. */
  tabId: string;
  children?: ReactNode;
}

/** Panel de una pestaña. Si no está activo queda montado con `hidden` (D-T06-3). */
export function TabPanel({ tabId, children }: TabPanelProps) {
  const contexto = useContext(TabsContext);
  if (!contexto) throw new Error('TabPanel debe usarse dentro de Tabs');

  return (
    <div
      role="tabpanel"
      id={contexto.panelId(tabId)}
      aria-labelledby={contexto.tabId(tabId)}
      hidden={contexto.value !== tabId}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
