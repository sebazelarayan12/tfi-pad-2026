import { isApiError } from '@nexa/api';
import { AlertaError, Input } from '@nexa/ui';
import { useState, type KeyboardEvent } from 'react';

import { useBuscarPolizaPorNumero } from '../api/useBuscarPolizaPorNumero';
import { useCuotasDePoliza } from '../api/useCuotasDePoliza';
import { BUSQUEDA_POLIZA_NUMERO_DISPONIBLE } from '../config';
import { buscarPolizaSchema, MENSAJE_FORMATO_POLIZA } from '../schemas/buscarPoliza';
import { CobroCaja } from './CobroCaja';

const TEXTO_SIN_BUSQUEDA = 'Todavía no se puede buscar por número.';
const TEXTO_NO_ENCONTRADA = 'No se encontró ninguna póliza con ese número.';
const TEXTO_SIN_CLIENTE = 'No disponible';
const TEXTO_ERROR_CUOTAS = 'No se pudieron cargar las cuotas.';
const AYUDA_COBRO = 'Se emite la factura con CAE al confirmar.';

function CuotasDePoliza({ polizaId }: { polizaId: string }) {
  const cuotas = useCuotasDePoliza(polizaId);

  if (cuotas.isPending) return <p className="text-body-sm text-text-secondary">Cargando cuotas…</p>;
  if (cuotas.isError) {
    const detalle = isApiError(cuotas.error) ? cuotas.error.detail : null;
    return <AlertaError>{detalle ?? TEXTO_ERROR_CUOTAS}</AlertaError>;
  }
  return (
    <CobroCaja
      key={polizaId}
      cuotas={cuotas.data}
      etiquetaBoton="Registrar pago"
      ayuda={AYUDA_COBRO}
    />
  );
}

function BuscadorPoliza() {
  const [escrito, setEscrito] = useState('');
  const [buscado, setBuscado] = useState('');
  const [errorFormato, setErrorFormato] = useState<string | null>(null);
  const poliza = useBuscarPolizaPorNumero(buscado);

  function buscar() {
    if (escrito.trim() === '') {
      setErrorFormato(null);
      setBuscado('');
      return;
    }
    const valido = buscarPolizaSchema.safeParse({ numero: escrito });
    if (!valido.success) {
      setErrorFormato(MENSAJE_FORMATO_POLIZA);
      setBuscado('');
      return;
    }
    setErrorFormato(null);
    setBuscado(valido.data.numero);
  }

  function alPresionar(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== 'Enter') return;
    evento.preventDefault();
    buscar();
  }

  const noEncontrada = poliza.isSuccess && poliza.data === null;

  return (
    <div className="flex flex-col gap-sp-16">
      <Input
        label="Póliza"
        value={escrito}
        onChange={(evento) => setEscrito(evento.target.value)}
        onKeyDown={alPresionar}
        onBlur={buscar}
        error={errorFormato !== null}
        helper={errorFormato ?? undefined}
        autoComplete="off"
        className="font-mono"
      />

      {noEncontrada ? (
        <p role="status" className="text-body-sm text-text-secondary">
          {TEXTO_NO_ENCONTRADA}
        </p>
      ) : null}

      {poliza.data ? (
        <>
          <dl className="flex flex-col gap-sp-4">
            <dt className="text-label text-text-secondary">Cliente</dt>
            <dd className="text-body-sm text-text-primary">{TEXTO_SIN_CLIENTE}</dd>
          </dl>
          <div className="flex flex-col gap-sp-8">
            <h4 className="text-label text-text-secondary">Cuotas impagas</h4>
            <CuotasDePoliza polizaId={poliza.data.id} />
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Rail de caja de B11. Sin PB-06 no busca por número y solo avisa (RV-D29, D-B19-08). */
export function CajaRail() {
  return (
    <section aria-labelledby="titulo-caja" className="flex flex-col gap-sp-16">
      <h3 id="titulo-caja" className="text-h3 text-text-primary">
        Registrar pago en caja
      </h3>
      {BUSQUEDA_POLIZA_NUMERO_DISPONIBLE ? (
        <BuscadorPoliza />
      ) : (
        <p className="text-body-sm text-text-secondary">{TEXTO_SIN_BUSQUEDA}</p>
      )}
    </section>
  );
}
