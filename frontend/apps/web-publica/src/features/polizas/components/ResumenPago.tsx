import { formatearImporte } from '@nexa/api';
import { Button, CardWidget, Dato } from '@nexa/ui';

import type { SeleccionCuotas } from '../hooks/useSeleccionCuotas';
import { RUTA_MEDIO_DE_PAGO, RUTA_PAGO_FACIL, useNavegarAPago } from '../hooks/useNavegarAPago';
import type { EstadoMiPoliza } from '../types/navegacion';

interface ResumenPagoProps {
  estado: EstadoMiPoliza;
  seleccion: SeleccionCuotas;
}

/** Resumen y acciones de pago. Navega con `state`, nunca con datos en la URL (FC12). */
export function ResumenPago({ estado, seleccion }: ResumenPagoProps) {
  const irA = useNavegarAPago(estado, seleccion);
  const sinSeleccion = seleccion.cantidadSeleccionadas === 0;

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
