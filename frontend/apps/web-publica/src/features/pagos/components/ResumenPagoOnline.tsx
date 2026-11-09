import {
  formatearFechaCalendario,
  formatearImporte,
  type CuotaPublica,
  type EstadoCuotaPublica,
} from '@nexa/api';
import { CardWidget, EstadoBadge, type BadgeEstado, type LinkRenderProps } from '@nexa/ui';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import { formatearListaCuotas } from '../../../shared/formato/listaCuotas';
import type { EstadoMiPoliza } from '../../polizas';

const RUTA_MI_POLIZA = '/poliza';

const BADGE_POR_ESTADO: Record<EstadoCuotaPublica, BadgeEstado> = {
  PAGADA: 'Pagada',
  PENDIENTE: 'Pendiente',
  VENCIDA: 'Vencida',
  ANULADA: 'Anulada',
};

const FILA = 'flex items-center justify-between gap-sp-12';
const VALOR = 'font-mono text-mono text-text-primary';

interface ResumenPagoOnlineProps {
  /** Estado de W2 que se devuelve a W3 al cambiar las cuotas (sin `cuotaIds`, DN-W6-4). */
  base: EstadoMiPoliza;
  /** Cuotas elegidas, ordenadas por número. */
  cuotas: ReadonlyArray<CuotaPublica>;
  /** Cantidad total de cuotas de la póliza ("Cuota 8 de 12"). */
  totalCuotasPoliza: number;
}

/** Suma en centavos enteros para no arrastrar errores de coma flotante (W-06 §6 paso 6). */
function sumarTotales(cuotas: ReadonlyArray<CuotaPublica>): number {
  const centavos = cuotas.reduce((suma, cuota) => suma + Math.round(cuota.total * 100), 0);
  return centavos / 100;
}

function textoRecargo(numeros: ReadonlyArray<number>): string | null {
  if (numeros.length === 0) return null;
  const sujeto = numeros.length === 1 ? 'de la cuota' : 'de las cuotas';
  return `Incluye el recargo ${sujeto} ${formatearListaCuotas(numeros)}`;
}

function DetalleCuota({
  cuota,
  totalCuotasPoliza,
}: {
  cuota: CuotaPublica;
  totalCuotasPoliza: number;
}) {
  const conRecargo = cuota.recargo > 0;

  return (
    <div className="flex flex-col gap-sp-16">
      <div className={FILA}>
        <div className="flex flex-col gap-sp-4">
          <p className="text-h3 text-text-primary">{`Cuota ${cuota.numero} de ${totalCuotasPoliza}`}</p>
          <p className="text-body-sm text-text-secondary">
            {`Vencimiento ${formatearFechaCalendario(cuota.vencimiento)}`}
          </p>
        </div>
        <EstadoBadge estado={BADGE_POR_ESTADO[cuota.estado]} />
      </div>
      <dl className="flex flex-col gap-sp-16 text-body-sm">
        <div className={FILA}>
          <dt className="text-text-secondary">Importe de la cuota</dt>
          <dd className={VALOR}>{formatearImporte(cuota.importe)}</dd>
        </div>
        {conRecargo ? (
          <>
            <div className={FILA}>
              <dt className="text-text-secondary">Recargo por vencimiento (5%)</dt>
              <dd className={VALOR}>{formatearImporte(cuota.recargo)}</dd>
            </div>
            <div className={FILA}>
              <dt className="text-body text-text-primary">{`Total cuota ${cuota.numero}`}</dt>
              <dd className={VALOR}>{formatearImporte(cuota.total)}</dd>
            </div>
          </>
        ) : null}
      </dl>
    </div>
  );
}

/** Columna derecha de W4: "Resumen de pago" y "Detalle de cuotas" (W4 §3, §9.2). */
export function ResumenPagoOnline({ base, cuotas, totalCuotasPoliza }: ResumenPagoOnlineProps) {
  const { consulta } = base;
  const total = sumarTotales(cuotas);
  const recargo = textoRecargo(cuotas.filter((cuota) => cuota.recargo > 0).map((c) => c.numero));
  const etiquetaTotal = cuotas.length === 1 ? '1 cuota' : `${cuotas.length} cuotas`;

  // "Cambiar cuotas" vuelve a W3 con el estado de W2 por `state`, nunca por la URL (FC12).
  function enlaceMiPoliza({ href, className, onClick, children }: LinkRenderProps) {
    return (
      <Link to={href} state={base} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-sp-16">
      <CardWidget
        title="Resumen de pago"
        action={{ label: 'Cambiar cuotas', href: RUTA_MI_POLIZA, renderLink: enlaceMiPoliza }}
      >
        <p>{`Póliza ${consulta.numeroPoliza} · Plan ${consulta.plan.codigo} ${consulta.plan.nombre}`}</p>
      </CardWidget>

      <section
        aria-labelledby="titulo-detalle-cuotas"
        className="flex flex-col gap-sp-16 rounded-card border border-border-hairline bg-surface-panel p-sp-24"
      >
        <h3 id="titulo-detalle-cuotas" className="sr-only">
          Detalle de cuotas
        </h3>
        {cuotas.map((cuota) => (
          <Fragment key={cuota.idCuota}>
            <DetalleCuota cuota={cuota} totalCuotasPoliza={totalCuotasPoliza} />
            <hr className="border-border-hairline" />
          </Fragment>
        ))}
        <div className={FILA}>
          <div className="flex flex-col gap-sp-4">
            <p className="text-h3 text-text-primary">{`Total a pagar (${etiquetaTotal})`}</p>
            {recargo ? <p className="text-body-sm text-text-secondary">{recargo}</p> : null}
          </div>
          <p className="font-mono text-mono-lg text-text-primary">{formatearImporte(total)}</p>
        </div>
      </section>
    </div>
  );
}
