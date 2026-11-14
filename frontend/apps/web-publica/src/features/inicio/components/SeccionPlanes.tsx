import { Chip } from '@nexa/ui';

import { INTERIOR_SECCION, SECCION_BLANCA, TITULO_SECCION } from '../../../marca/estilos';
import { TablaPlanes } from '../../planes';
import { ANCLA_PLANES } from '../destinos';

// Textos literales de W1 §5 (ficha W-01 §8). La nota al pie la pone la home (ficha W-02 §8).
const TITULO = 'Planes';
const SUBTITULO = 'Cobertura de referencia para autos, motos y camionetas.';
const CHIP = 'Valores de referencia';
const NOTA = 'La prima final depende del vehículo y se informa al cotizar.';

/** Sección Planes de la home: encabezado, chip informativo, tabla de W-02 y nota. */
export function SeccionPlanes() {
  return (
    <section
      id={ANCLA_PLANES}
      aria-labelledby="titulo-planes"
      className={`${SECCION_BLANCA} scroll-mt-sp-64`}
    >
      <div className={INTERIOR_SECCION}>
        <div className="flex flex-col items-start gap-sp-16 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-sp-12">
            <h2 id="titulo-planes" className={TITULO_SECCION}>
              {TITULO}
            </h2>
            <p className="text-body-lg text-text-secondary">{SUBTITULO}</p>
          </div>
          <Chip tipo="neutro" label={CHIP} />
        </div>
        <TablaPlanes />
        <p className="text-body text-text-secondary">{NOTA}</p>
      </div>
    </section>
  );
}
