import type { CuotaPublica } from '@nexa/api';
import { Button } from '@nexa/ui';
import { PrinterIcon } from '@phosphor-icons/react/dist/csr/Printer';
import { useEffect, useMemo, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import type { EstadoPagoPublico } from '../../polizas';
import { useCuponesPublicos } from '../api/useCuponesPublicos';
import { CuponPagoFacil } from '../components/CuponPagoFacil';
import '../components/imprimir.css';
import { leerEstadoCupon } from '../schemas/estadoNavegacion';

const RUTA_CONSULTA = '/consultar-poliza';
const RUTA_MEDIO_DE_PAGO = '/poliza/pagar/medio-de-pago';

function cuotasElegidas(estado: EstadoPagoPublico): CuotaPublica[] {
  const elegidas = new Set(estado.cuotaIds);
  return estado.consulta.cuotas
    .filter((cuota) => elegidas.has(cuota.idCuota))
    .toSorted((a, b) => a.numero - b.numero);
}

function imprimir() {
  window.print();
}

function CuponesPagoFacil({ estado }: { estado: EstadoPagoPublico }) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const { dni, numeroPoliza, consulta } = estado;
  const cuotas = useMemo(() => cuotasElegidas(estado), [estado]);
  const consultas = useCuponesPublicos({ dni, numeroPoliza, cuotas });
  const algunoCargando = consultas.some((consulta) => consulta.isPending);

  // W5 §12: al entrar, el foco va al título.
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  return (
    <div data-pagina="cupon-pago-facil" className="flex flex-col items-center gap-sp-24 py-sp-40">
      <h1 ref={titulo} tabIndex={-1} className="text-h2 text-text-primary">
        Cupón de pago
      </h1>

      {cuotas.map((cuota, indice) => {
        const resultado = consultas[indice];
        return (
          <CuponPagoFacil
            key={cuota.idCuota}
            numeroPoliza={numeroPoliza}
            dni={dni}
            numeroCuota={cuota.numero}
            totalCuotas={consulta.cuotas.length}
            cupon={resultado?.data}
            cargando={resultado?.isPending ?? true}
            reintentando={resultado?.isFetching ?? false}
            error={resultado?.error}
            onReintentar={() => void resultado?.refetch()}
          />
        );
      })}

      <Button
        label="Imprimir"
        icon={<PrinterIcon size={16} weight="regular" />}
        disabled={algunoCargando}
        onClick={imprimir}
        className="print:hidden"
      />
    </div>
  );
}

/**
 * W5 `/poliza/pagar/pago-facil`: un cupón por cuota elegida (D-04). Sin estado de W2 vuelve a la
 * consulta; sin cuotas, a W4 con el mismo estado (W5 §2). No cobra ni registra el pago.
 */
export function CuponPagoFacilPage() {
  const { state } = useLocation();
  const lectura = useMemo(() => leerEstadoCupon(state), [state]);

  if (lectura.tipo === 'sin-estado') return <Navigate to={RUTA_CONSULTA} replace />;
  if (lectura.tipo === 'sin-cuotas') {
    return <Navigate to={RUTA_MEDIO_DE_PAGO} state={state} replace />;
  }
  return <CuponesPagoFacil estado={lectura.estado} />;
}
