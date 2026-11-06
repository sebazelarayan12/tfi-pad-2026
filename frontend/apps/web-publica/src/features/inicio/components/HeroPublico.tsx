import { ButtonLink } from '@nexa/ui';

import { renderLinkRouter } from '../../../shared/enlace/renderLinkRouter';
import { ANCLA_PLANES, RUTA_CONSULTAR_POLIZA } from '../destinos';

// Textos literales de W1 §5 (ficha W-01 §8).
const TITULO = 'Tu vehículo asegurado, tu póliza siempre a mano.';
const BAJADA = 'Consultá el estado de tu póliza, revisá tus cuotas y pagalas online o en efectivo.';
const CTA_CONSULTAR = 'Consultar póliza';
const CTA_PLANES = 'Ver planes';
const MARCADOR_IMAGEN = 'Foto: auto y moto';

/** Hero de la home: título, bajada, CTAs y marcador de la imagen (DN-W1-2, DN-W1-3). */
export function HeroPublico() {
  return (
    <section className="flex flex-col gap-sp-24 py-sp-48 md:flex-row md:items-center md:gap-sp-48">
      <div className="flex flex-1 flex-col gap-sp-24">
        <h1 className="text-h1 font-bold text-text-primary md:text-display">{TITULO}</h1>
        <p className="text-body text-text-secondary">{BAJADA}</p>
        <div className="flex flex-wrap gap-sp-12">
          <ButtonLink
            label={CTA_CONSULTAR}
            href={RUTA_CONSULTAR_POLIZA}
            renderLink={renderLinkRouter}
          />
          {/* Ancla de la misma página: `<a href>` nativo para que el navegador baje a la sección. */}
          <ButtonLink label={CTA_PLANES} href={`#${ANCLA_PLANES}`} variant="secondary" />
        </div>
      </div>
      <div
        aria-hidden="true"
        className="flex h-[220px] w-full items-center justify-center rounded-card bg-surface-subtle md:h-[420px] md:w-[560px] md:shrink-0"
      >
        <span className="text-caption text-text-tertiary">{MARCADOR_IMAGEN}</span>
      </div>
    </section>
  );
}
