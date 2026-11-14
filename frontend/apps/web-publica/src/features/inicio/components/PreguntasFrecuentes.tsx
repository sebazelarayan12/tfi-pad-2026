import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';

import { FOCO, INTERIOR_SECCION, SECCION_BLANCA, TITULO_SECCION } from '../../../marca/estilos';
import { Aparecer } from '../../../shared/animacion/Aparecer';

const TITULO = 'Preguntas frecuentes';

const PREGUNTAS: ReadonlyArray<{ pregunta: string; respuesta: string }> = [
  {
    pregunta: '¿Cómo consulto mi póliza?',
    respuesta:
      'Entrá a "Consultar póliza" e ingresá tu DNI y el número de tu póliza (por ejemplo, POL-0000042). Ves el estado, los datos y las cuotas al instante.',
  },
  {
    pregunta: '¿Cuándo vencen las cuotas?',
    respuesta:
      'Vencen el día 10 de cada mes. Si pagás después de esa fecha, se suma un recargo del 5%.',
  },
  {
    pregunta: '¿Qué pasa si debo más de una cuota?',
    respuesta:
      'Con 2 cuotas vencidas sin pagar, la póliza pasa a Suspendida. Vuelve a estar Vigente cuando pagás las cuotas vencidas.',
  },
  {
    pregunta: '¿Cómo pago en efectivo?',
    respuesta:
      'Desde tu póliza descargá el cupón de Pago Fácil y pagalo con su código de barras. La acreditación puede demorar hasta 72 h hábiles.',
  },
];

/** Preguntas frecuentes con `details`/`summary` nativos: teclado y lector de pantalla incluidos. */
export function PreguntasFrecuentes() {
  return (
    <section aria-labelledby="titulo-faq" className={SECCION_BLANCA}>
      <div className={`${INTERIOR_SECCION} lg:flex-row lg:gap-sp-80`}>
        <Aparecer className="lg:w-1/3 lg:shrink-0">
          <h2 id="titulo-faq" className={`${TITULO_SECCION}`}>
            {TITULO}
          </h2>
        </Aparecer>
        <div className="flex flex-1 flex-col border-t border-border-hairline">
          {PREGUNTAS.map(({ pregunta, respuesta }, indice) => (
            <Aparecer key={pregunta} retardoMs={indice * 120}>
              <details className="group border-b border-border-hairline py-sp-24">
                <summary
                  className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-sp-16 rounded-input font-display text-titulo-md text-tema-titulo ${FOCO} [&::-webkit-details-marker]:hidden`}
                >
                  {pregunta}
                  <CaretDownIcon
                    aria-hidden="true"
                    size={20}
                    className="shrink-0 text-tema-acento transition duration-300 group-open:rotate-180 motion-reduce:transition-none"
                  />
                </summary>
                <p className="max-w-2xl pt-sp-12 text-body-lg text-text-secondary">{respuesta}</p>
              </details>
            </Aparecer>
          ))}
        </div>
      </div>
    </section>
  );
}
