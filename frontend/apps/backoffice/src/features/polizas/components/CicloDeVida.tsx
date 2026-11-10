import type { CicloDeVida as Ciclo } from '../lib/cicloDeVida';
import { TITULO_CICLO } from '../textosDetalle';

// La línea que une los pasos se dibuja por tramo (`before`), centrada con el punto, desde sm.
const TRAMO =
  'sm:before:absolute sm:before:left-0 sm:before:right-0 sm:before:top-2 sm:before:h-px sm:before:bg-border-hairline';

/** Línea de vida de 5 pasos; el paso actual lleva `aria-current="step"` (B10 §3). */
export function CicloDeVida({ pasos, actual }: Ciclo) {
  return (
    <section
      aria-labelledby="ciclo-titulo"
      className="flex flex-col gap-sp-16 rounded-card border border-border-hairline bg-surface-panel p-sp-24"
    >
      <h2 id="ciclo-titulo" className="text-h3 text-text-primary">
        {TITULO_CICLO}
      </h2>
      <ol className="grid grid-cols-1 gap-sp-12 sm:grid-cols-5 sm:gap-x-0">
        {pasos.map((paso) => {
          const esActual = paso.numero === actual;
          return (
            <li
              key={paso.numero}
              aria-current={esActual ? 'step' : undefined}
              className={`relative flex items-start gap-sp-8 sm:flex-col sm:items-center sm:gap-sp-4 sm:text-center ${TRAMO}`}
            >
              <span aria-hidden="true" className="relative flex h-4 shrink-0 items-center">
                <span
                  className={`rounded-full ${
                    esActual ? 'size-4 bg-action-primary' : 'size-3 bg-border-strong'
                  }`}
                />
              </span>
              <span className="flex flex-col gap-sp-4 sm:items-center">
                <span
                  className={`text-label ${esActual ? 'text-text-primary' : 'text-text-secondary'}`}
                >
                  {paso.estado}
                </span>
                {paso.nota ? (
                  <span className="text-caption text-text-secondary">{paso.nota}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
