import { CUOTA_VENCIDA } from '../handlers/cuotas';

export const resumenInicio = {
  fechaCorte: '2026-10-28',
  polizasPorEstado: { Pendiente: 1, Vigente: 1, Suspendida: 0, Cancelada: 0, Vencida: 0 },
  cuotasVencidas: { total: 1, recargoPorcentaje: 5, recientes: [CUOTA_VENCIDA] },
  rendicionPendienteHoy: true,
  facturasPendientesCae: 0,
};
