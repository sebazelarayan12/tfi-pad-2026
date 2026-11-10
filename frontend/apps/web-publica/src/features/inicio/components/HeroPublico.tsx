import { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/csr/ShieldCheck';
import type { ReactNode } from 'react';

import { Aparecer } from '../../../shared/animacion/Aparecer';
import { renderLinkRouter } from '../../../shared/enlace/renderLinkRouter';
import { ANCLA_PLANES, RUTA_CONSULTAR_POLIZA } from '../destinos';

// Textos literales de W1 §5 (ficha W-01 §8).
const TITULO = 'Tu vehículo asegurado, tu póliza siempre a mano.';
const BAJADA = 'Consultá el estado de tu póliza, revisá tus cuotas y pagalas online o en efectivo.';
const CTA_CONSULTAR = 'Consultar póliza';
const CTA_PLANES = 'Ver planes';
const ETIQUETA = 'Seguros para autos y motos, 100% online';
const ALT_FOTO = 'Conductora sonriendo dentro de su auto durante una tarde de sol';

const PASOS: ReadonlyArray<{ titulo: string; texto: string }> = [
  { titulo: 'Ingresá tus datos', texto: 'Tu DNI y el número de tu póliza.' },
  { titulo: 'Revisá tus cuotas', texto: 'Estado, vencimientos e importes.' },
  { titulo: 'Pagá como quieras', texto: 'Online o en efectivo con Pago Fácil.' },
];

const TAMANO_ICONO = 22;

// Botones para fondo oscuro: el `Button` del sistema es negro y no se vería sobre el panel.
const BOTON =
  'inline-flex h-10 items-center justify-center rounded-pill px-sp-16 text-body focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lime motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-0.5';
const BOTON_PRINCIPAL = `${BOTON} bg-accent-lime text-text-primary`;
const BOTON_SECUNDARIO = `${BOTON} border border-action-on-primary text-action-on-primary`;

interface TarjetaFlotanteProps {
  icono: ReactNode;
  titulo: string;
  texto: string;
  /** Posición sobre la foto y desfase de la flotación. */
  clases: string;
}

/** Tarjeta decorativa que flota sobre la foto; no es interactiva ni la lee el lector de pantalla. */
function TarjetaFlotante({ icono, titulo, texto, clases }: TarjetaFlotanteProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute flex items-center gap-sp-12 rounded-input border border-border-hairline bg-surface-panel py-sp-12 pl-sp-12 pr-sp-16 shadow-shell flotar ${clases}`}
    >
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-lime text-text-primary">
        {icono}
      </span>
      <span className="flex flex-col">
        <span className="text-label text-text-primary">{titulo}</span>
        <span className="text-caption text-text-secondary">{texto}</span>
      </span>
    </div>
  );
}

/**
 * Hero de la home sobre un panel verde suave: título, bajada, CTAs, foto con dos tarjetas
 * flotantes y los tres pasos para consultar y pagar.
 */
export function HeroPublico() {
  return (
    <section className="relative my-sp-16 flex flex-col gap-sp-40 overflow-hidden rounded-card bg-action-primary p-sp-24 md:p-sp-48">
      {/* Manchas de color difuminadas de fondo (decorativas). */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-sp-64 -top-sp-64 size-80 rounded-full bg-accent-lime opacity-30 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-sp-64 -left-sp-64 size-72 rounded-full bg-accent-lime opacity-20 blur-3xl"
      />

      <div className="relative flex flex-col gap-sp-32 md:flex-row md:items-center md:gap-sp-48">
        <div className="flex flex-1 flex-col items-start gap-sp-24">
          <Aparecer>
            <span className="inline-flex h-7 items-center rounded-pill bg-accent-lime px-sp-12 text-label text-text-primary">
              {ETIQUETA}
            </span>
          </Aparecer>
          <Aparecer retardoMs={100}>
            <h1 className="text-h1 font-bold text-action-on-primary md:text-display">{TITULO}</h1>
          </Aparecer>
          <Aparecer retardoMs={200}>
            <p className="text-body text-surface-subtle">{BAJADA}</p>
          </Aparecer>
          <Aparecer retardoMs={300} className="flex flex-wrap gap-sp-12">
            {renderLinkRouter({
              href: RUTA_CONSULTAR_POLIZA,
              className: BOTON_PRINCIPAL,
              children: CTA_CONSULTAR,
            })}
            {/* Ancla de la misma página: `<a href>` nativo para que el navegador baje a la sección. */}
            <a href={`#${ANCLA_PLANES}`} className={BOTON_SECUNDARIO}>
              {CTA_PLANES}
            </a>
          </Aparecer>
        </div>

        <Aparecer retardoMs={150} className="w-full md:w-[520px] md:shrink-0">
          <div className="relative">
            <div className="h-[280px] overflow-hidden rounded-card bg-surface-subtle md:h-[400px]">
              <img
                src="/img/mujer-auto.jpg"
                alt={ALT_FOTO}
                width={1400}
                height={933}
                className="size-full object-cover transition duration-700 ease-out motion-safe:hover:scale-105"
              />
            </div>
            <TarjetaFlotante
              icono={<ShieldCheckIcon size={TAMANO_ICONO} weight="regular" />}
              titulo="Cobertura activa"
              texto="Consultala con tu DNI"
              clases="-left-sp-16 bottom-sp-24 md:-left-sp-24"
            />
            <TarjetaFlotante
              icono={<CheckCircleIcon size={TAMANO_ICONO} weight="regular" />}
              titulo="Pago aprobado"
              texto="Factura emitida"
              clases="-top-sp-16 right-sp-16 flotar-demora md:-right-sp-16 md:top-sp-24"
            />
          </div>
        </Aparecer>
      </div>

      <ol className="relative grid grid-cols-1 gap-sp-12 md:grid-cols-3">
        {PASOS.map((paso, indice) => (
          <li key={paso.titulo}>
            <Aparecer retardoMs={indice * 120} className="h-full">
              <div className="flex h-full items-center gap-sp-12 rounded-input bg-surface-panel px-sp-16 py-sp-12">
                <span
                  aria-hidden="true"
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-action-primary font-mono text-mono text-action-on-primary"
                >
                  {indice + 1}
                </span>
                <span className="flex flex-col">
                  <span className="text-h3 text-text-primary">{paso.titulo}</span>
                  <span className="text-body-sm text-text-secondary">{paso.texto}</span>
                </span>
              </div>
            </Aparecer>
          </li>
        ))}
      </ol>
    </section>
  );
}
