import { formatearFechaCalendario, formatearFechaHora, formatearImporte } from '@nexa/api';
import { AlertaError, CardWidget, Dato } from '@nexa/ui';

import { useFactura, usePago } from '../api/usePagos';
import { EstadoFacturaBadge } from './EstadoFacturaBadge';
import { mensajeDeErrorConsulta } from './mensajesError';
import { VerFacturaPdf } from './VerFacturaPdf';

export interface FacturaPanelProps {
  pagoId: string;
}

const TEXTO_FACTURA_NO_ENCONTRADA = 'No se encontró la factura del pago.';

function CargandoFactura() {
  return (
    <p role="status" className="text-body-sm text-text-secondary">
      Cargando factura…
    </p>
  );
}

/** Vista de la factura de un pago (B10/B11); no ofrece reintento ni descarga. */
export function FacturaPanel({ pagoId }: FacturaPanelProps) {
  const pago = usePago(pagoId);
  const factura = useFactura(pago.data?.factura === null || pago.data === undefined ? '' : pagoId);

  if (pago.isPending) {
    return (
      <CardWidget title="Factura">
        <CargandoFactura />
      </CardWidget>
    );
  }

  if (pago.isError) {
    return (
      <CardWidget title="Factura">
        <AlertaError>{mensajeDeErrorConsulta(pago.error)}</AlertaError>
      </CardWidget>
    );
  }

  if (pago.data === undefined) {
    return (
      <CardWidget title="Factura">
        <CargandoFactura />
      </CardWidget>
    );
  }

  if (pago.data.factura === null) {
    return (
      <CardWidget title="Factura">
        <AlertaError>{TEXTO_FACTURA_NO_ENCONTRADA}</AlertaError>
      </CardWidget>
    );
  }

  if (factura.isPending) {
    return (
      <CardWidget title="Factura">
        <CargandoFactura />
      </CardWidget>
    );
  }

  if (factura.isError) {
    return (
      <CardWidget title="Factura">
        <AlertaError>{mensajeDeErrorConsulta(factura.error)}</AlertaError>
      </CardWidget>
    );
  }

  if (factura.data === undefined) {
    return (
      <CardWidget title="Factura">
        <CargandoFactura />
      </CardWidget>
    );
  }

  const datos = factura.data;

  return (
    <CardWidget title="Factura">
      <div className="grid grid-cols-1 gap-sp-16">
        <Dato label="Estado" value={<EstadoFacturaBadge estado={datos.estado} />} />
        <Dato
          label="Número"
          value={datos.numero === '' ? 'Pendiente de numeración' : datos.numero}
          mono
        />
        <Dato label="Tipo" value={datos.tipo} />
        <Dato label="Importe (IVA incluido)" value={formatearImporte(datos.importe)} mono />
        {datos.cae !== null ? <Dato label="CAE" value={datos.cae} mono /> : null}
        {datos.vencimientoCae !== null ? (
          <Dato
            label="Vencimiento del CAE"
            value={formatearFechaCalendario(datos.vencimientoCae)}
          />
        ) : null}
        <Dato label="Fecha de emisión" value={formatearFechaHora(datos.fechaEmision)} />
        {datos.estado === 'AUTORIZADA' ? <VerFacturaPdf pagoId={pagoId} /> : null}
      </div>
    </CardWidget>
  );
}
