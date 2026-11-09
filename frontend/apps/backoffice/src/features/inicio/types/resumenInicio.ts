import type { CuotaListItemMock } from '@nexa/api';
import type { EstadoPolizaInicio } from './indicadores';

export interface ResumenInicioResponse {
  fechaCorte: string;
  polizasPorEstado: Record<EstadoPolizaInicio, number>;
  cuotasVencidas: { total: number; recargoPorcentaje: number; recientes: CuotaListItemMock[] };
  rendicionPendienteHoy: boolean;
  facturasPendientesCae: number;
}
