import { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/csr/ShieldCheck';
import type { ReactNode } from 'react';

import { Aparecer } from '../../../shared/animacion/Aparecer';
import { renderLinkRouter } from '../../../shared/enlace/renderLinkRouter';
import { ANCHO_COMPLETO, BOTON_AZUL, BOTON_FANTASMA, CONTENEDOR } from '../../../marca/estilos';
import { useReproducirAlEntrar } from '../../../shared/video/useReproducirAlEntrar';
import { ANCLA_PLANES, RUTA_CONSULTAR_POLIZA } from '../destinos';

// Textos literales de W1 §5 (ficha W-01 §8).
const TITULO = 'Tu vehículo asegurado, tu póliza siempre a mano.';
const BAJADA = 'Consultá el estado de tu póliza, revisá tus cuotas y pagalas online o en efectivo.';
const CTA_CONSULTAR = 'Consultar póliza';
const CTA_PLANES = 'Ver planes';
const ETIQUETA = 'Seguros para autos y motos, 100% online';
const POSTER_VIDEO = '/video/portada-final.jpg';
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

/** Tarjeta decorativa de estado; no es interactiva ni la lee el lector de pantalla. */
function TarjetaFlotante({ icono, titulo, texto, clases = '' }: TarjetaFlotanteProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center gap-sp-12 rounded-input border border-border-hairline bg-white py-sp-12 pl-sp-12 pr-sp-20 flotar ${clases}`}
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
 * Hero de la home: video de portada a la derecha (el auto en la mano y el escudo de Nexa), que se
 * reproduce una vez al entrar y queda en el último cuadro; a la izquierda, un velo blanco con el
 * título marino, el CTA azul como acción principal y, debajo, los tres pasos.
 */
export function HeroPublico() {
  const { bloqueRef, videoRef } = useReproducirAlEntrar<HTMLElement>();

  return (
    <>
      <section
        ref={bloqueRef}
        aria-labelledby="titulo-hero"
        className={`${ANCHO_COMPLETO} flex flex-col overflow-hidden bg-white md:min-h-[min(88vh,820px)] md:justify-center`}
      >
        <div className="relative h-[300px] sm:h-[420px] md:absolute md:inset-0 md:h-auto">
          {/* Decorativo: el poster es el último cuadro, así sin reproducir ya se ve el logo. */}
          <video
            ref={videoRef}
            aria-hidden="true"
            muted
            playsInline
            preload="auto"
            poster={POSTER_VIDEO}
            width={1920}
            height={1080}
            className="absolute inset-0 size-full object-cover object-[82%_center] md:object-[70%_center] lg:object-center"
          >
            <source src="/video/portada.webm" type="video/webm" />
            <source src="/video/portada.mp4" type="video/mp4" />
          </video>
          <span
            aria-hidden="true"
            className="fundido-blanco-izquierda absolute inset-0 hidden md:block"
          />
          <span
            aria-hidden="true"
            className="fundido-blanco-abajo absolute inset-x-0 bottom-0 h-1/3 md:h-1/4"
          />
        </div>
        <div className={`${CONTENEDOR} relative pb-sp-24 md:py-sp-112`}>
          <Aparecer className="flex max-w-xl flex-col items-start gap-sp-24 lg:max-w-[600px]">
            <span className="text-body font-medium text-marca-azul">{ETIQUETA}</span>
            <h1 id="titulo-hero" className="text-balance text-hero-sm md:text-hero">
              {TITULO}
            </h1>
            <p className="max-w-lg text-body-lg text-text-secondary">{BAJADA}</p>
            <div className="flex flex-wrap gap-sp-12 pt-sp-8">
              {renderLinkRouter({
                href: RUTA_CONSULTAR_POLIZA,
                className: BOTON_AZUL,
                children: CTA_CONSULTAR,
              })}
              {/* Ancla de la misma página: `<a href>` nativo para que el navegador baje a la sección. */}
              <a href={`#${ANCLA_PLANES}`} className={BOTON_FANTASMA}>
                {CTA_PLANES}
              </a>
            </div>
            {/* Tarjetas de estado debajo de los botones (solo desde escritorio grande). */}
            <div className="hidden flex-wrap gap-sp-12 pt-sp-16 lg:flex">
              <TarjetaFlotante
                icono={<CheckCircleIcon size={TAMANO_ICONO} />}
                titulo="Pago aprobado"
                texto="Factura emitida"
              />
              <TarjetaFlotante
                icono={<ShieldCheckIcon size={TAMANO_ICONO} />}
                titulo="Cobertura activa"
                texto="Consultala con tu DNI"
                clases="flotar-demora"
              />
            </div>
          </Aparecer>
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
