import type { CicloDeVida as Ciclo } from '../lib/cicloDeVida';
import { TITULO_CICLO } from '../textosDetalle';

/** Línea de vida de 5 pasos; el paso actual lleva `aria-current="step"` (B10 §3). */
export function CicloDeVida({ pasos, actual }: Ciclo) {
  return (
    <section aria-labelledby="ciclo-titulo" className="flex flex-col gap-sp-12">
      <h2 id="ciclo-titulo" className="text-h3 text-text-primary">
        {TITULO_CICLO}
      </h2>
      <ol className="grid grid-cols-1 gap-sp-12 sm:grid-cols-5">
        {pasos.map((paso) => {
          const esActual = paso.numero === actual;
          return (
            <li
              key={paso.numero}
              aria-current={esActual ? 'step' : undefined}
              className="flex items-start gap-sp-8 sm:flex-col"
            >
              <span
                aria-hidden="true"
                className={`mt-sp-4 shrink-0 rounded-full ${
                  esActual ? 'size-4 bg-action-primary' : 'size-3 bg-border-strong'
                }`}
              />
              <span className="flex flex-col gap-sp-4">
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
