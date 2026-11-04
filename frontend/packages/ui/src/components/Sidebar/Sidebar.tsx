import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { Fragment, useId, type FormEvent, type ReactNode } from 'react';

import { LogoNexa } from '../LogoNexa/LogoNexa';
import { NavItem, type NavItemProps } from '../NavItem/NavItem';

export interface GrupoNav {
  id: string;
  titulo?: string;
  items: ReadonlyArray<NavItemProps>;
}

export interface SidebarUsuario {
  initials: string;
  name: string;
  role: string;
}

export interface SidebarProps {
  /** Ítems ya filtrados por rol: el filtro lo hace el layout (FB7.10). */
  grupos: ReadonlyArray<GrupoNav>;
  user: SidebarUsuario;
  /** Sin acción definida en el diseño (DP-5): sin callback, enviar no hace nada. */
  onSearch?: (query: string) => void;
  menuUsuario?: ReactNode;
}

const ETIQUETA_BUSCAR = 'Buscar';

/** Barra lateral del backoffice (`design-system §5.8`). Presentacional. */
export function Sidebar({ grupos, user, onSearch, menuUsuario }: SidebarProps) {
  const idBuscar = useId();
  const visibles = grupos.filter((grupo) => grupo.items.length > 0);

  const alBuscar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const valor = new FormData(evento.currentTarget).get('q');
    const texto = typeof valor === 'string' ? valor.trim() : '';
    if (texto) onSearch?.(texto);
  };

  return (
    <aside
      aria-label="Navegación principal"
      className="flex h-full w-[232px] flex-col gap-sp-16 bg-surface-sidebar p-sp-16"
    >
      <LogoNexa />

      <form role="search" onSubmit={alBuscar} className="relative">
        <label htmlFor={idBuscar} className="sr-only">
          {ETIQUETA_BUSCAR}
        </label>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-sp-12 inline-flex items-center text-text-tertiary"
        >
          <MagnifyingGlassIcon size={16} weight="regular" />
        </span>
        <input
          id={idBuscar}
          name="q"
          type="search"
          placeholder={ETIQUETA_BUSCAR}
          className="h-9 w-full rounded-input border border-border-hairline bg-surface-panel pl-sp-32 pr-sp-12 text-body-sm text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        />
      </form>

      {visibles.map((grupo, indice) => (
        <Fragment key={grupo.id}>
          {indice > 0 ? <hr className="border-border-hairline" /> : null}
          <nav aria-label={grupo.titulo ?? 'Navegación'} className="flex flex-col gap-sp-4">
            {grupo.items.map((item) => (
              <NavItem key={`${item.label}-${item.icon}`} {...item} />
            ))}
          </nav>
        </Fragment>
      ))}

      <div className="flex-1" />

      <div className="flex items-center gap-sp-8">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-accent-lime-soft text-caption text-text-primary"
        >
          {user.initials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span title={user.name} className="truncate text-body-sm text-text-primary">
            {user.name}
          </span>
          <span className="text-caption text-text-tertiary">{user.role}</span>
        </div>
        {menuUsuario ?? null}
      </div>
    </aside>
  );
}
