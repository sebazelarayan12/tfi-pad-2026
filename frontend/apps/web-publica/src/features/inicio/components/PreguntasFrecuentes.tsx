import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';

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
    <section aria-labelledby="titulo-faq" className="flex flex-col gap-sp-24 py-sp-48">
      <h2 id="titulo-faq" className="text-h2 text-text-primary">
        {TITULO}
      </h2>
      <Aparecer className="flex flex-col gap-sp-12">
        {PREGUNTAS.map(({ pregunta, respuesta }) => (
          <details
            key={pregunta}
            className="group rounded-card border border-border-hairline bg-surface-panel px-sp-20 py-sp-16 open:bg-surface-subtle"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-sp-16 rounded-input text-h3 text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary [&::-webkit-details-marker]:hidden">
              {pregunta}
              <CaretDownIcon
                aria-hidden="true"
                size={16}
                className="shrink-0 transition duration-300 group-open:rotate-180 motion-reduce:transition-none"
              />
            </summary>
            <p className="pt-sp-12 text-body-sm text-text-secondary">{respuesta}</p>
          </details>
        ))}
      </Aparecer>
    </section>
  );
}
