import { ButtonLink, EstadoBadge } from '@nexa/ui';

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

/** Hero de la home: título, bajada, CTAs, foto y una tarjeta de ejemplo de la póliza. */
export function HeroPublico() {
  return (
    <section className="flex flex-col gap-sp-24 py-sp-48 md:flex-row md:items-center md:gap-sp-48">
      <div className="flex flex-1 flex-col items-start gap-sp-24">
        <Aparecer>
          <span className="inline-flex h-7 items-center rounded-pill bg-accent-lime px-sp-12 text-label text-text-primary">
            {ETIQUETA}
          </span>
        </Aparecer>
        <Aparecer retardoMs={100}>
          <h1 className="text-h1 font-bold text-text-primary md:text-display">{TITULO}</h1>
        </Aparecer>
        <Aparecer retardoMs={200}>
          <p className="text-body text-text-secondary">{BAJADA}</p>
        </Aparecer>
        <Aparecer retardoMs={300} className="flex flex-wrap gap-sp-12">
          <ButtonLink
            label={CTA_CONSULTAR}
            href={RUTA_CONSULTAR_POLIZA}
            renderLink={renderLinkRouter}
          />
          {/* Ancla de la misma página: `<a href>` nativo para que el navegador baje a la sección. */}
          <ButtonLink label={CTA_PLANES} href={`#${ANCLA_PLANES}`} variant="secondary" />
        </Aparecer>
      </div>
      <Aparecer retardoMs={150} className="w-full md:w-[560px] md:shrink-0">
        <div className="relative h-[260px] overflow-hidden rounded-card bg-surface-subtle md:h-[420px]">
          <img
            src="/img/mujer-auto.jpg"
            alt={ALT_FOTO}
            width={1400}
            height={933}
            className="size-full object-cover transition duration-700 ease-out motion-safe:hover:scale-105"
          />
          {/* Tarjeta decorativa: ejemplo de cómo se ve una póliza en el sitio. */}
          <div
            aria-hidden="true"
            className="absolute bottom-sp-16 left-sp-16 flex items-center gap-sp-12 rounded-input border border-border-hairline bg-surface-panel px-sp-16 py-sp-12"
          >
            <span className="font-mono text-mono text-text-primary">POL-0000042</span>
            <EstadoBadge estado="Vigente" />
          </div>
        </div>
      </Aparecer>
    </section>
  );
}
