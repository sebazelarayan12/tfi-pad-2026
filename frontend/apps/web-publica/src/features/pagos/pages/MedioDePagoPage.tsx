import { isApiError, type CuotaPublica, type PagoPublicoRequest } from '@nexa/api';
import { AlertaError, Button } from '@nexa/ui';
import { BarcodeIcon } from '@phosphor-icons/react/dist/csr/Barcode';
import { CreditCardIcon } from '@phosphor-icons/react/dist/csr/CreditCard';
import { LockKeyIcon } from '@phosphor-icons/react/dist/csr/LockKey';
import { WalletIcon } from '@phosphor-icons/react/dist/csr/Wallet';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { formatearListaCuotas } from '../../../shared/formato/listaCuotas';
import type { EstadoPagoPublico } from '../../polizas';
import { usePagarOnline } from '../api/usePagarOnline';
import { OpcionMedioPago } from '../components/OpcionMedioPago';
import { ResumenPagoOnline } from '../components/ResumenPagoOnline';
import { leerEstadoMedioDePago } from '../schemas/estadoNavegacion';

const RUTA_CONSULTA = '/consultar-poliza';
const RUTA_MI_POLIZA = '/poliza';
const RUTA_PAGO_FACIL = '/poliza/pagar/pago-facil';

type MedioPago = 'pasarela-a' | 'pasarela-b' | 'pago-facil';

interface OpcionMedio {
  valor: MedioPago;
  titulo: string;
  descripcion: string;
  icono: ReactNode;
}

const DESCRIPCION_ONLINE = 'Pago online con tarjeta o dinero en cuenta.';

/** Nombres y orden fijos hasta PB-22 (D-09); la descripción de Pago Fácil sigue DN-W6-5. */
const OPCIONES: ReadonlyArray<OpcionMedio> = [
  {
    valor: 'pasarela-a',
    titulo: 'Pasarela A',
    descripcion: DESCRIPCION_ONLINE,
    icono: <CreditCardIcon size={24} weight="regular" />,
  },
  {
    valor: 'pasarela-b',
    titulo: 'Pasarela B',
    descripcion: DESCRIPCION_ONLINE,
    icono: <WalletIcon size={24} weight="regular" />,
  },
  {
    valor: 'pago-facil',
    titulo: 'Pago Fácil',
    descripcion: 'Efectivo con cupón de código de barras. Acreditación hasta 72 h hábiles.',
    icono: <BarcodeIcon size={24} weight="regular" />,
  },
];

/** Mapeo de la opción al `proveedor` del back (D-09, DN-W6-2). Pago Fácil no llama a la API. */
const PROVEEDOR: Record<Exclude<MedioPago, 'pago-facil'>, PagoPublicoRequest['proveedor']> = {
  'pasarela-a': 'pasarela1',
  'pasarela-b': 'pasarela2',
};

// Textos de W-06 §8: el 429 es el literal de W2; el 502 y el de red, propuestas aprobadas (DN-W6-7).
const ERROR_429 = 'Hiciste muchos intentos. Esperá un minuto y volvé a probar.';
const ERROR_502 = 'No pudimos conectar con la pasarela. Intentá de nuevo en unos minutos.';
const ERROR_RED = 'No pudimos iniciar el pago. Revisá tu conexión e intentá de nuevo.';
const PRIVACIDAD = 'Tus datos viajan cifrados y no se guardan en este dispositivo.';

const ID_ETIQUETA_GRUPO = 'etiqueta-medio-de-pago';

/** 400 y 404 muestran el `detail` del back (FC10); 429, 502 y red, sus textos (W-06 §9). */
function mensajeDeError(error: unknown): string {
  if (!isApiError(error) || error.kind !== 'http') return ERROR_RED;
  if (error.status === 429) return ERROR_429;
  if ((error.status === 400 || error.status === 404) && error.detail) return error.detail;
  if (error.status === 502) return error.detail ?? ERROR_502;
  return ERROR_RED;
}

function subtitulo(numeros: ReadonlyArray<number>): string {
  const sujeto = numeros.length === 1 ? 'la cuota' : 'las cuotas';
  return `Vas a pagar ${sujeto} ${formatearListaCuotas(numeros)} de la póliza `;
}

function cuotasElegidas(estado: EstadoPagoPublico): CuotaPublica[] {
  const elegidas = new Set(estado.cuotaIds);
  return estado.consulta.cuotas
    .filter((cuota) => elegidas.has(cuota.idCuota))
    .toSorted((a, b) => a.numero - b.numero);
}

function MedioDePago({ estado }: { estado: EstadoPagoPublico }) {
  const navigate = useNavigate();
  const titulo = useRef<HTMLHeadingElement>(null);
  const [medio, setMedio] = useState<MedioPago | null>(null);
  const { pagar, enviando, error } = usePagarOnline();

  const { dni, numeroPoliza, consulta, cuotaIds } = estado;
  const cuotas = useMemo(() => cuotasElegidas(estado), [estado]);
  const base = useMemo(() => ({ dni, numeroPoliza, consulta }), [dni, numeroPoliza, consulta]);
  const mensajeError = error ? mensajeDeError(error) : null;

  // W4 §12: al entrar, el foco va al h1.
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  // FC16: el error se anuncia (role="alert") y recibe el foco al aparecer.
  const enfocarError = useCallback((nodo: HTMLDivElement | null) => {
    nodo?.focus();
  }, []);

  function continuar() {
    if (medio === null) return;
    if (medio === 'pago-facil') {
      void navigate(RUTA_PAGO_FACIL, { state: estado });
      return;
    }
    pagar({ dni, numeroPoliza, cuotaIds, proveedor: PROVEEDOR[medio] });
  }

  return (
    <div className="flex flex-col gap-sp-32 py-sp-24 lg:grid lg:grid-cols-[minmax(0,560px)_minmax(0,480px)] lg:items-start lg:justify-center lg:gap-sp-64 lg:py-sp-48">
      <div className="flex flex-col gap-sp-24">
        <header className="flex flex-col gap-sp-8">
          <h1 ref={titulo} tabIndex={-1} className="text-h1 text-text-primary">
            Elegí tu medio de pago
          </h1>
          <p className="text-body text-text-secondary">
            {subtitulo(cuotas.map((cuota) => cuota.numero))}
            <span className="whitespace-nowrap font-mono">{numeroPoliza}</span>.
          </p>
        </header>

        {/* Columna del Figma (nodo 18:1049): etiqueta, opciones, botón y privacidad separados por 24 px. */}
        <div className="flex flex-col gap-sp-24">
          {/* h2 con estilo H3: la etiqueta del grupo también ordena los títulos (h1 → h2 → h3). */}
          <h2 id={ID_ETIQUETA_GRUPO} className="text-h3 text-text-primary">
            Medio de pago
          </h2>
          <div
            role="radiogroup"
            aria-labelledby={ID_ETIQUETA_GRUPO}
            className="flex flex-col gap-sp-12"
          >
            {OPCIONES.map((opcion) => (
              <OpcionMedioPago
                key={opcion.valor}
                grupo="medio-de-pago"
                valor={opcion.valor}
                titulo={opcion.titulo}
                descripcion={opcion.descripcion}
                icono={opcion.icono}
                seleccionada={medio === opcion.valor}
                deshabilitada={enviando}
                onSeleccionar={setMedio}
              />
            ))}
          </div>
        </div>

        {mensajeError ? (
          <div key={mensajeError} ref={enfocarError} tabIndex={-1} className="outline-none">
            <AlertaError>{mensajeError}</AlertaError>
          </div>
        ) : null}

        <div className="flex flex-col gap-sp-24">
          <Button
            label="Continuar"
            disabled={medio === null || enviando}
            aria-busy={enviando}
            onClick={continuar}
            className="w-full sm:w-auto sm:self-start"
          />
          <p className="flex items-center gap-sp-8 text-body-sm text-text-secondary">
            <span aria-hidden="true" className="inline-flex shrink-0">
              <LockKeyIcon size={16} weight="regular" />
            </span>
            {PRIVACIDAD}
          </p>
        </div>
      </div>

      <ResumenPagoOnline base={base} cuotas={cuotas} totalCuotasPoliza={consulta.cuotas.length} />
    </div>
  );
}

/**
 * W4 `/poliza/pagar/medio-de-pago`. Sin estado de W2 vuelve a la consulta; con cuotas inválidas
 * vuelve a W3 con el mismo estado (W-06 §6 paso 1). No llama a la API al montar (FC11).
 */
export function MedioDePagoPage() {
  const { state } = useLocation();
  const lectura = useMemo(() => leerEstadoMedioDePago(state), [state]);

  if (lectura.tipo === 'sin-estado') return <Navigate to={RUTA_CONSULTA} replace />;
  if (lectura.tipo === 'cuotas-invalidas') {
    return <Navigate to={RUTA_MI_POLIZA} state={lectura.base} replace />;
  }
  return <MedioDePago estado={lectura.estado} />;
}
