export const ESTADOS_POLIZA = [
  'Vigente',
  'Pendiente',
  'Suspendida',
  'Cancelada',
  'Vencida',
] as const;
export type EstadoPolizaInicio = (typeof ESTADOS_POLIZA)[number];

export interface Indicador {
  data?: number;
  isPending: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
}
