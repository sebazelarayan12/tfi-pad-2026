import type { RolSesion } from '@nexa/api';
import type { GrupoNav } from '@nexa/ui';
import type { ReactNode } from 'react';

/** Título de la pantalla, declarado por cada ruta en su `handle`. */
export interface HandleRuta {
  titulo: string;
  accion?: ReactNode;
  ocultarBuscador?: boolean;
  tituloPrincipal?: boolean;
}

// Vehículos no tiene pantalla propia (DP-1): se llega desde la ficha de un cliente, así que va
// anidado bajo Clientes y sin `href` (no interactivo). Se marca al cargar un vehículo.
export const NAV_PRINCIPAL: GrupoNav = {
  id: 'principal',
  titulo: 'Principal',
  items: [
    { label: 'Inicio', icon: 'house', href: '/inicio' },
    { label: 'Clientes', icon: 'users', href: '/clientes' },
    { label: 'Vehículos', icon: 'car', sub: true },
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
    { label: 'Grupos externos', icon: 'users', href: '/grupos' },
  ],
};

export const NAV_INTEGRACIONES: GrupoNav = {
  id: 'integraciones',
  titulo: 'Integraciones',
  items: [{ label: 'Integraciones', icon: 'list', href: '/integraciones' }],
};

/** Sección de la ruta que marca el sub-ítem Vehículos (`/clientes/:id/vehiculos/...`). */
export const SEGMENTO_VEHICULOS = '/vehiculos/';

/** El grupo de administración solo lo ve el Administrador (FB7.10); sin rol no hay navegación. */
export function gruposParaRol(rol: RolSesion | null): GrupoNav[] {
  if (rol === null) return [];
  if (rol === 'Grupo') return [NAV_INTEGRACIONES];
  return rol === 'Administrador' ? [NAV_PRINCIPAL, NAV_ADMIN] : [NAV_PRINCIPAL];
}
