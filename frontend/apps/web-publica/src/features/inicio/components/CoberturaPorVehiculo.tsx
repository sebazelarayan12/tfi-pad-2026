import { ButtonLink } from '@nexa/ui';

import { Aparecer } from '../../../shared/animacion/Aparecer';
import { ANCLA_PLANES } from '../destinos';

const TITULO = 'Un plan para cada vehículo';
const CTA = 'Ver planes';

interface Vehiculo {
  titulo: string;
  texto: string;
  foto: string;
  /** Recorte vertical de la foto para que el vehículo quede a la vista. */
  posicion: string;
  alt: string;
}

const VEHICULOS: ReadonlyArray<Vehiculo> = [
  {
    titulo: 'Autos y camionetas',
    texto: 'De la Responsabilidad Civil al Todo Riesgo: elegí cuánta protección querés llevar.',
    foto: '/img/auto.jpg',
    posicion: 'object-[center_88%]',
    alt: 'Auto circulando de noche por una ruta, con el cielo naranja del atardecer',
  },
  {
    titulo: 'Motos',
    texto: 'La misma gestión online para tu moto: consultá, pagá y descargá tu factura.',
    foto: '/img/moto.jpg',
    posicion: 'object-[center_62%]',
    alt: 'Motociclista avanzando de noche por una avenida con luces de la ciudad',
  },
];

/** Dos tarjetas con foto, una por tipo de vehículo; el CTA baja a la tabla de planes. */
export function CoberturaPorVehiculo() {
  return (
    <section aria-labelledby="titulo-vehiculos" className="flex flex-col gap-sp-24 py-sp-48">
      <h2 id="titulo-vehiculos" className="text-h2 text-text-primary">
        {TITULO}
      </h2>
      <ul className="grid grid-cols-1 gap-sp-24 md:grid-cols-2">
        {VEHICULOS.map((vehiculo, indice) => (
          <li key={vehiculo.titulo}>
            <Aparecer retardoMs={indice * 150} className="h-full">
              <article className="group relative h-[320px] overflow-hidden rounded-card bg-surface-sidebar">
                <img
                  src={vehiculo.foto}
                  alt={vehiculo.alt}
                  loading="lazy"
                  width={1400}
                  height={933}
                  className={`size-full object-cover ${vehiculo.posicion} transition duration-700 ease-out motion-safe:group-hover:scale-105`}
                />
                {/* Degradado oscuro para que el texto blanco se lea sobre cualquier foto. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/20 to-transparent"
                />
                <div className="absolute inset-x-sp-24 top-sp-24 flex flex-col items-start gap-sp-12">
                  <h3 className="text-h2 text-action-on-primary">{vehiculo.titulo}</h3>
                  <p className="text-body-sm text-action-on-primary">{vehiculo.texto}</p>
                  <ButtonLink label={CTA} href={`#${ANCLA_PLANES}`} variant="secondary" size="s" />
                </div>
              </article>
            </Aparecer>
          </li>
        ))}
      </ul>
    </section>
  );
}
