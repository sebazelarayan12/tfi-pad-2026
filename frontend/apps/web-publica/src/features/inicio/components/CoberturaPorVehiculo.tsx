import {
  BOTON_BLANCO,
  INTERIOR_SECCION,
  SECCION_NIEBLA,
  TITULO_SECCION,
} from '../../../marca/estilos';
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
    posicion: 'object-[center_70%]',
    alt: 'Auto plateado andando por una ruta recta con montañas al fondo',
  },
  {
    titulo: 'Motos',
    texto: 'La misma gestión online para tu moto: consultá, pagá y descargá tu factura.',
    foto: '/img/moto.jpg',
    posicion: 'object-[center_60%]',
    alt: 'Motociclista con casco en una moto deportiva roja por la ruta, al atardecer',
  },
];

/** Dos tarjetas con foto, una por tipo de vehículo; el CTA baja a la tabla de planes. */
export function CoberturaPorVehiculo() {
  return (
    <section aria-labelledby="titulo-vehiculos" className={SECCION_NIEBLA}>
      <div className={INTERIOR_SECCION}>
        <h2 id="titulo-vehiculos" className={TITULO_SECCION}>
          {TITULO}
        </h2>
        <ul className="grid grid-cols-1 gap-sp-24 md:grid-cols-2">
          {VEHICULOS.map((vehiculo, indice) => (
            <li key={vehiculo.titulo}>
              <Aparecer retardoMs={indice * 150} className="h-full">
                <article className="relative flex h-[440px] items-end overflow-hidden rounded-card bg-marca-marino md:h-[520px]">
                  <img
                    src={vehiculo.foto}
                    alt={vehiculo.alt}
                    loading="lazy"
                    width={1600}
                    height={1067}
                    className={`absolute inset-0 size-full object-cover ${vehiculo.posicion}`}
                  />
                  {/* Velo marino desde abajo para que el texto blanco se lea sobre cualquier foto. */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-marca-marino via-marca-marino/60 to-transparent"
                  />
                  <div className="relative flex flex-col items-start gap-sp-12 p-sp-24 md:p-sp-40">
                    <h3 className="text-titulo-lg text-white">{vehiculo.titulo}</h3>
                    <p className="max-w-md text-body-lg text-white/90">{vehiculo.texto}</p>
                    {/* Ancla de la misma página: `<a href>` nativo para que el navegador baje a la tabla. */}
                    <a href={`#${ANCLA_PLANES}`} className={`mt-sp-8 ${BOTON_BLANCO}`}>
                      {CTA}
                    </a>
                  </div>
                </article>
              </Aparecer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
