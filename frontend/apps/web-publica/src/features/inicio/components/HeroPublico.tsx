import { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/csr/ShieldCheck';
import type { ReactNode } from 'react';

import { Aparecer } from '../../../shared/animacion/Aparecer';
import { renderLinkRouter } from '../../../shared/enlace/renderLinkRouter';
import {
  ANCHO_COMPLETO,
  BOTON_AZUL,
  BOTON_FANTASMA_CLARO,
  CONTENEDOR,
} from '../../../marca/estilos';
import { ANCLA_PLANES, RUTA_CONSULTAR_POLIZA } from '../destinos';

// Textos literales de W1 §5 (ficha W-01 §8).
const TITULO = 'Tu vehículo asegurado, tu póliza siempre a mano.';
const BAJADA = 'Consultá el estado de tu póliza, revisá tus cuotas y pagalas online o en efectivo.';
const CTA_CONSULTAR = 'Consultar póliza';
const CTA_PLANES = 'Ver planes';
const ETIQUETA = 'Seguros para autos y motos, 100% online';
const ALT_FOTO = 'Conductora sonriendo dentro de su auto durante una tarde de sol';
const TITULO_PASOS = 'Cómo consultar tu póliza';

const PASOS: ReadonlyArray<{ titulo: string; texto: string }> = [
  { titulo: 'Ingresá tus datos', texto: 'Tu DNI y el número de tu póliza.' },
  { titulo: 'Revisá tus cuotas', texto: 'Estado, vencimientos e importes.' },
  { titulo: 'Pagá como quieras', texto: 'Online o en efectivo con Pago Fácil.' },
];

const TAMANO_ICONO = 22;

interface TarjetaFlotanteProps {
  icono: ReactNode;
  titulo: string;
  texto: string;
  /** Desfase de la flotación. */
  clases?: string;
}

/** Tarjeta decorativa sobre la foto; no es interactiva ni la lee el lector de pantalla. */
function TarjetaFlotante({ icono, titulo, texto, clases = '' }: TarjetaFlotanteProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center gap-sp-12 rounded-input border border-white/20 bg-white py-sp-12 pl-sp-12 pr-sp-20 flotar ${clases}`}
    >
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-marca-celeste-suave text-marca-azul">
        {icono}
      </span>
      <span className="flex flex-col">
        <span className="text-body font-semibold text-marca-marino">{titulo}</span>
        <span className="text-label font-normal text-text-secondary">{texto}</span>
      </span>
    </div>
  );
}

/**
 * Hero de la home: foto a todo el ancho con el título grande abajo a la izquierda (DESIGN.md,
 * Hero), el CTA azul como acción principal y, debajo, los tres pasos para consultar y pagar.
 */
export function HeroPublico() {
  return (
    <>
      <section
        aria-labelledby="titulo-hero"
        className={`${ANCHO_COMPLETO} flex min-h-[600px] items-end overflow-hidden bg-marca-marino md:min-h-[min(84vh,760px)]`}
      >
        <img
          src="/img/mujer-auto.jpg"
          alt={ALT_FOTO}
          width={1400}
          height={933}
          className="absolute inset-0 size-full object-cover object-[70%_center]"
        />
        {/* Velo marino para que el texto blanco se lea sobre cualquier parte de la foto. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-marca-marino via-marca-marino/60 to-marca-marino/0 md:bg-gradient-to-r md:via-marca-marino/45"
        />
        <div className={`${CONTENEDOR} relative pb-sp-48 pt-sp-112 md:pb-sp-80`}>
          <Aparecer className="flex max-w-3xl flex-col items-start gap-sp-24">
            <span className="text-body font-medium text-marca-celeste">{ETIQUETA}</span>
            <h1 id="titulo-hero" className="text-balance text-hero-sm text-white md:text-hero">
              {TITULO}
            </h1>
            <p className="max-w-xl text-body-lg text-white/85">{BAJADA}</p>
            <div className="flex flex-wrap gap-sp-12 pt-sp-8">
              {renderLinkRouter({
                href: RUTA_CONSULTAR_POLIZA,
                className: BOTON_AZUL,
                children: CTA_CONSULTAR,
              })}
              {/* Ancla de la misma página: `<a href>` nativo para que el navegador baje a la sección. */}
              <a href={`#${ANCLA_PLANES}`} className={BOTON_FANTASMA_CLARO}>
                {CTA_PLANES}
              </a>
            </div>
          </Aparecer>
          {/* Tarjetas de estado sobre la foto, a la derecha (solo desde tablet). */}
          <div className="absolute bottom-sp-80 right-sp-40 hidden flex-col items-end gap-sp-12 lg:flex">
            <TarjetaFlotante
              icono={<CheckCircleIcon size={TAMANO_ICONO} />}
              titulo="Pago aprobado"
              texto="Factura emitida"
            />
            <TarjetaFlotante
              icono={<ShieldCheckIcon size={TAMANO_ICONO} />}
              titulo="Cobertura activa"
              texto="Consultala con tu DNI"
              clases="flotar-demora mr-sp-48"
            />
          </div>
        </div>
      </section>

      <section aria-label={TITULO_PASOS} className="py-sp-48 md:py-sp-64">
        <ol className="grid grid-cols-1 md:grid-cols-3">
          {PASOS.map((paso, indice) => (
            <li
              key={paso.titulo}
              className="flex gap-sp-16 border-t border-border-hairline py-sp-24 md:border-l md:border-t-0 md:px-sp-32 md:py-0 md:first:border-l-0 md:first:pl-0"
            >
              <span
                aria-hidden="true"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-marca-marino font-display text-body font-semibold text-white"
              >
                {indice + 1}
              </span>
              <span className="flex flex-col gap-sp-4">
                <span className="font-display text-titulo-md text-marca-marino">{paso.titulo}</span>
                <span className="text-body text-text-secondary">{paso.texto}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
