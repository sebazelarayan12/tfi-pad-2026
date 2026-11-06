import { Button } from '@nexa/ui';
import { Navigate, useLocation } from 'react-router-dom';

import { BadgeEstadoPoliza } from '../components/BadgeEstadoPoliza';
import { CicloPoliza } from '../components/CicloPoliza';
import { DatosPoliza } from '../components/DatosPoliza';
import { ResumenPago } from '../components/ResumenPago';
import { TablaCuotas } from '../components/TablaCuotas';
import { MAXIMO_CUOTAS, useSeleccionCuotas } from '../hooks/useSeleccionCuotas';
import { leerEstadoNavegacion } from '../schemas/navegacion';
import type { EstadoMiPoliza } from '../types/navegacion';

const RUTA_CONSULTA = '/consultar-poliza';
const TEXTO_SIN_CUOTAS = 'Esta póliza no tiene cuotas para mostrar.';
const TEXTO_AYUDA = 'Vencen el día 10 de cada mes. Recargo del 5% al vencer.';
const TEXTO_TOPE = `Podés pagar hasta ${MAXIMO_CUOTAS} cuotas por vez.`;

function MiPoliza({ estado }: { estado: EstadoMiPoliza }) {
  const { consulta } = estado;
  const seleccion = useSeleccionCuotas(consulta.cuotas);

  return (
    <div className="flex flex-col gap-sp-24 py-sp-24">
      <header className="flex flex-wrap items-center gap-sp-12">
        <h1 className="text-h1 text-text-primary">Mi póliza</h1>
        <span className="font-mono text-mono text-text-secondary">{consulta.numeroPoliza}</span>
        <BadgeEstadoPoliza estado={consulta.estado} />
      </header>
      {/* El Figma pasa de H1 a H3 (Card/Widget es H3, D-T07-3): el H2 oculto evita saltar un nivel. */}
      <h2 className="sr-only">Detalle de la póliza</h2>

      {consulta.cuotas.length === 0 ? (
        <div className="flex flex-col gap-sp-24">
          <DatosPoliza consulta={consulta} />
          <p className="text-body text-text-secondary">{TEXTO_SIN_CUOTAS}</p>
          <CicloPoliza />
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-sp-24">
          <div className="flex flex-col gap-sp-24">
            <DatosPoliza consulta={consulta} />
            <section aria-labelledby="titulo-cuotas" className="flex flex-col gap-sp-12">
              <div className="flex items-center justify-between gap-sp-12">
                <h3 id="titulo-cuotas" className="text-h3 text-text-primary">
                  Cuotas
                </h3>
                <Button
                  label="Seleccionar impagas"
                  variant="secondary"
                  size="s"
                  onClick={seleccion.seleccionarImpagas}
                />
              </div>
              <p className="text-body-sm text-text-secondary">{TEXTO_AYUDA}</p>
              {seleccion.alcanzoTope ? (
                <p role="status" className="text-body-sm text-text-primary">
                  {TEXTO_TOPE}
                </p>
              ) : null}
              <TablaCuotas cuotas={consulta.cuotas} seleccion={seleccion} />
            </section>
            <CicloPoliza />
          </div>
          <ResumenPago estado={estado} seleccion={seleccion} />
        </div>
      )}
    </div>
  );
}

/** W3 "Mi póliza" (escritorio). Sin estado de W2 válido vuelve a la consulta; no llama a la API. */
export function PolizaPublicaPage() {
  const { state } = useLocation();
  const estado = leerEstadoNavegacion(state);

  if (estado === null) return <Navigate to={RUTA_CONSULTA} replace />;
  return <MiPoliza estado={estado} />;
}
