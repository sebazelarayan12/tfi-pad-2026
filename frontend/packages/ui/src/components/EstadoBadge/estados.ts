/**
 * Los nueve estados del Badge/Estado del diseño (`design-system §5.4`), en ese orden.
 * Es el contrato que consume US-FE-T-10 para mapear los valores del back.
 */
export const BADGE_ESTADOS = [
  'Pendiente',
  'Vigente',
  'Suspendida',
  'Cancelada',
  'Vencida',
  'Pagada',
  'Anulada',
  'Validado',
  'Pendiente CAE',
] as const;

export type BadgeEstado = (typeof BADGE_ESTADOS)[number];

export interface EstadoBadgeTokens {
  fondo: string;
  texto: string;
}

const VIGENTE: EstadoBadgeTokens = {
  fondo: 'bg-status-vigente-bg',
  texto: 'text-status-vigente-text',
};
const VENCIDA: EstadoBadgeTokens = {
  fondo: 'bg-status-vencida-bg',
  texto: 'text-status-vencida-text',
};
const SUSPENDIDA: EstadoBadgeTokens = {
  fondo: 'bg-status-suspendida-bg',
  texto: 'text-status-suspendida-text',
};

/**
 * Clases completas por estado (nunca interpoladas: Tailwind no genera `bg-${x}`).
 * El `Record` obliga a cubrir los nueve valores.
 */
export const ESTADO_BADGE_TOKENS: Record<BadgeEstado, EstadoBadgeTokens> = {
  Pendiente: { fondo: 'bg-status-pendiente-bg', texto: 'text-status-pendiente-text' },
  Vigente: VIGENTE,
  Suspendida: SUSPENDIDA,
  Cancelada: { fondo: 'bg-status-cancelada-bg', texto: 'text-status-cancelada-text' },
  Vencida: VENCIDA,
  Pagada: VIGENTE,
  Anulada: VENCIDA,
  Validado: VIGENTE,
  'Pendiente CAE': SUSPENDIDA,
};
