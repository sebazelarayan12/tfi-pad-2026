import type { RolUsuario } from '@nexa/api';
import type { GrupoNav } from '@nexa/ui';
import type { ReactNode } from 'react';

/** Título de la pantalla, declarado por cada ruta en su `handle`. */
export interface HandleRuta {
  titulo: string;
  accion?: ReactNode;
  ocultarBuscador?: boolean;
  tituloPrincipal?: boolean;
}

// Vehículos no tiene pantalla todavía (DP-1): sin `href` queda no interactivo.
export const NAV_PRINCIPAL: GrupoNav = {
  id: 'principal',
  titulo: 'Principal',
  items: [
    { label: 'Inicio', icon: 'house', href: '/inicio' },
    { label: 'Clientes', icon: 'users', href: '/clientes' },
    { label: 'Vehículos', icon: 'car' },
    { label: 'Cotizaciones', icon: 'calculator', href: '/cotizaciones' },
    { label: 'Pólizas', icon: 'file-text', href: '/polizas' },
    { label: 'Pagos y facturas', icon: 'receipt', href: '/pagos' },
    { label: 'Pago Fácil', icon: 'barcode', href: '/pago-facil' },
  ],
};

export const NAV_ADMIN: GrupoNav = {
  id: 'administracion',
  titulo: 'Administración',
  items: [
    { label: 'Planes', icon: 'list', href: '/planes' },
    { label: 'Usuarios', icon: 'user-circle', href: '/usuarios' },
  ],
};

/** El grupo de administración solo lo ve el Administrador (FB7.10); sin rol no hay navegación. */
export function gruposParaRol(rol: RolUsuario | null): GrupoNav[] {
  if (rol === null) return [];
  return rol === 'Administrador' ? [NAV_PRINCIPAL, NAV_ADMIN] : [NAV_PRINCIPAL];
}
