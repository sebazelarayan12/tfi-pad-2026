import { useNavigate } from 'react-router-dom';

import type { EstadoMiPoliza, EstadoPagoPublico } from '../types/navegacion';
import type { SeleccionCuotas } from './useSeleccionCuotas';

export const RUTA_MEDIO_DE_PAGO = '/poliza/pagar/medio-de-pago';
export const RUTA_PAGO_FACIL = '/poliza/pagar/pago-facil';

/** Navega a W4 o W5 con las cuotas elegidas en `state`, nunca en la URL (FC12). */
export function useNavegarAPago(estado: EstadoMiPoliza, seleccion: SeleccionCuotas) {
  const navigate = useNavigate();
  return (ruta: string) => {
    const siguiente: EstadoPagoPublico = { ...estado, cuotaIds: seleccion.cuotaIds };
    void navigate(ruta, { state: siguiente });
  };
}
