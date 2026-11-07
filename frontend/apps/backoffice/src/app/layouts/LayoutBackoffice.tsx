import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom';
import { Backdrop, Shell, Sidebar } from '@nexa/ui';
import { cerrarSesion, useSesion } from '../../features/auth';
import { gruposParaRol, type HandleRuta } from './navegacionBackoffice';
import { Topbar } from './Topbar';

function DotsThreeIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 256 256"
      fill="currentColor"
    >
      <path d="M140 128a12 12 0 1 1-12-12 12 12 0 0 1 12 12Zm56-12a12 12 0 1 0 12 12 12 12 0 0 0-12-12Zm-136 0a12 12 0 1 0 12 12 12 12 0 0 0-12-12Z" />
    </svg>
  );
}

function MenuUsuario() {
  const [abierto, setAbierto] = useState(false);
  const navigate = useNavigate();
  const idMenu = useId();
  const boton = useRef<HTMLButtonElement>(null);
  const opcion = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return undefined;
    opcion.current?.focus();
    function alPresionar(evento: KeyboardEvent) {
      if (evento.key !== 'Escape') return;
      setAbierto(false);
      boton.current?.focus();
    }
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [abierto]);

  function salir() {
    cerrarSesion('manual');
    navigate('/login', { replace: true });
  }

  return (
    <div className="relative">
      <button
        ref={boton}
        type="button"
        aria-label="Menú de usuario"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? idMenu : undefined}
        onClick={() => setAbierto((valor) => !valor)}
        className="flex h-8 w-8 items-center justify-center rounded-pill text-text-primary"
      >
        <DotsThreeIcon />
      </button>
      {abierto ? (
        <div
          id={idMenu}
          role="menu"
          className="absolute bottom-full right-0 mb-sp-8 min-w-[160px] rounded-card border border-border-strong bg-surface-panel p-sp-4"
        >
          <button
            ref={opcion}
            type="button"
            role="menuitem"
            onClick={salir}
            className="w-full rounded-input px-sp-12 py-sp-8 text-left text-text-primary"
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}

function encabezadoDeRuta(matches: ReturnType<typeof useMatches>): Partial<HandleRuta> | undefined {
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const handle = matches[i]?.handle as Partial<HandleRuta> | undefined;
    if (handle?.titulo) return handle;
  }
  return undefined;
}

export function LayoutBackoffice() {
  const sesion = useSesion();
  const encabezado = encabezadoDeRuta(useMatches());
  const { pathname } = useLocation();
  const rol = sesion?.rol ?? null;
  const email = sesion?.email ?? null;
  const grupos = gruposParaRol(rol).map((grupo) => ({
    ...grupo,
    items: grupo.items.map((item) => {
      const href = item.href;
      return href
        ? {
            ...item,
            active: pathname === href || pathname.startsWith(`${href}/`),
            renderLink: (props: {
              className: string;
              'aria-current'?: 'page';
              children: ReactNode;
            }) => <Link to={href} {...props} />,
          }
        : item;
    }),
  }));

  const usuario = {
    initials: email ? email.charAt(0).toUpperCase() : '',
    name: email ?? '',
    role: rol ?? '',
  };

  return (
    <Backdrop>
      <div className="min-w-[1280px] p-sp-24">
        <Shell>
          {/* T-16: el Shell es presentacional; la app dispone sidebar y contenido en una fila. */}
          <div className="flex min-h-[calc(100dvh-48px)] overflow-hidden rounded-shell">
            <div className="shrink-0 bg-surface-sidebar">
              <Sidebar grupos={grupos} user={usuario} menuUsuario={<MenuUsuario />} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-sp-24 p-sp-32">
              <Topbar {...encabezado} />
              <main id="contenido">
                <Outlet />
              </main>
            </div>
          </div>
        </Shell>
      </div>
    </Backdrop>
  );
}
