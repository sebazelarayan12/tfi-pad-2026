// Barrel de @nexa/ui: cada primitivo agrega aquí su bloque de export.

// US-FE-T-04: Input y Select.
export { Input } from './components/Input/Input';
export type { InputProps } from './components/Input/Input';
export { Select } from './components/Select/Select';
export type { SelectOption, SelectProps } from './components/Select/Select';

// US-FE-T-05: Button, Chip y Badge/Estado.
export { Button } from './components/Button/Button';
export type { ButtonProps, ButtonSize, ButtonVariant } from './components/Button/Button';
export { Chip } from './components/Chip/Chip';
export type { ChipProps, ChipTipo } from './components/Chip/Chip';
export { EstadoBadge } from './components/EstadoBadge/EstadoBadge';
export type { EstadoBadgeProps } from './components/EstadoBadge/EstadoBadge';
export { BADGE_ESTADOS } from './components/EstadoBadge/estados';
export type { BadgeEstado } from './components/EstadoBadge/estados';

// US-FE-T-07: Card/Widget, Dato, AlertaError, Backdrop, Logo, Dialogo y Shell.
export { CardWidget } from './components/CardWidget/CardWidget';
export type { CardWidgetAction, CardWidgetProps } from './components/CardWidget/CardWidget';
export { Dato } from './components/Dato/Dato';
export type { DatoProps } from './components/Dato/Dato';
export { AlertaError } from './components/AlertaError/AlertaError';
export type { AlertaErrorProps } from './components/AlertaError/AlertaError';
export { Backdrop } from './components/Backdrop/Backdrop';
export type { BackdropProps } from './components/Backdrop/Backdrop';
export { LogoNexa } from './components/LogoNexa/LogoNexa';
export type { LogoNexaProps } from './components/LogoNexa/LogoNexa';
export { Dialogo } from './components/Dialogo/Dialogo';
export type { DialogoProps } from './components/Dialogo/Dialogo';
export { Shell } from './components/Shell/Shell';
export type { ShellProps } from './components/Shell/Shell';

// US-FE-T-06: Table y Tabs.
export { Table } from './components/Table/Table';
export type { TableColumn, TableProps } from './components/Table/Table';
export { TabPanel, Tabs } from './components/Tabs/Tabs';
export type { TabItem, TabPanelProps, TabsProps } from './components/Tabs/Tabs';

// US-FE-T-15: NavItem y Sidebar.
export { NavItem } from './components/NavItem/NavItem';
export type { NavItemLinkProps, NavItemProps } from './components/NavItem/NavItem';
export type { NavIcon } from './components/NavItem/iconos';
export { Sidebar } from './components/Sidebar/Sidebar';
export type { GrupoNav, SidebarProps, SidebarUsuario } from './components/Sidebar/Sidebar';
