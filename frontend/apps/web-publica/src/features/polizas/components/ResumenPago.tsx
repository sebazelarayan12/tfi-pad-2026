import { formatearImporte } from '@nexa/api';
import { Button, CardWidget, Dato } from '@nexa/ui';
import { useNavigate } from 'react-router-dom';

import type { EstadoMiPoliza, EstadoPagoPublico } from '../types/navegacion';
import type { SeleccionCuotas } from '../hooks/useSeleccionCuotas';

const RUTA_MEDIO_DE_PAGO = '/poliza/pagar/medio-de-pago';
const RUTA_PAGO_FACIL = '/poliza/pagar/pago-facil';

interface ResumenPagoProps {
  estado: EstadoMiPoliza;
  seleccion: SeleccionCuotas;
}

/** Resumen y acciones de pago. Navega con `state`, nunca con datos en la URL (FC12). */
export function ResumenPago({ estado, seleccion }: ResumenPagoProps) {
  const navigate = useNavigate();
  const sinSeleccion = seleccion.cantidadSeleccionadas === 0;

  function irA(ruta: string) {
    const siguiente: EstadoPagoPublico = { ...estado, cuotaIds: seleccion.cuotaIds };
    void navigate(ruta, { state: siguiente });
  }

  return (
    <CardWidget title="Resumen de pago">
      <div className="flex flex-col gap-sp-16">
        <Dato label="Cuotas seleccionadas" value={seleccion.listaNumeros} />
        <dl className="flex flex-col gap-sp-4">
          <dt className="text-label text-text-secondary">Total a pagar</dt>
          <dd aria-live="polite" className="font-mono text-mono-lg text-text-primary">
            {formatearImporte(seleccion.total)}
          </dd>
        </dl>
        <Button
          label="Pagar seleccionadas"
          disabled={sinSeleccion}
          className="w-full"
          onClick={() => irA(RUTA_MEDIO_DE_PAGO)}
        />
        <Button
          label="Descargar cupón Pago Fácil"
          variant="secondary"
          disabled={sinSeleccion}
          className="w-full"
          onClick={() => irA(RUTA_PAGO_FACIL)}
        />
      </div>
    </CardWidget>
  );
}
