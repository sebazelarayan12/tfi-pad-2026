import {
  BOTON_BLANCO,
  CONTENEDOR,
  FUNDIDO_A_MARINO,
  FUNDIDO_DESDE_MARINO,
  SECCION_MARINA,
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
    posicion: 'object-[85%_70%]',
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
    // Banda marina: entra y sale en degradé desde el blanco y las fotos se funden con el fondo.
    <section aria-labelledby="titulo-vehiculos" className={SECCION_MARINA}>
      <div aria-hidden="true" className={FUNDIDO_A_MARINO} />
      <div className={`${CONTENEDOR} flex flex-col gap-sp-40 py-sp-32`}>
        <Aparecer>
          <h2 id="titulo-vehiculos" className={`${TITULO_SECCION} text-white`}>
            {TITULO}
          </h2>
        </Aparecer>
        <ul className="grid grid-cols-1 gap-sp-48 md:grid-cols-2 md:gap-sp-24">
          {VEHICULOS.map((vehiculo, indice) => (
            <li key={vehiculo.titulo}>
              <Aparecer retardoMs={indice * 150} className="h-full">
                <article className="relative flex h-[460px] items-end md:h-[560px]">
                  <img
                    src={vehiculo.foto}
                    alt={vehiculo.alt}
                    loading="lazy"
                    width={1600}
                    height={1067}
                    className={`absolute inset-0 size-full object-cover ${vehiculo.posicion} [mask-image:radial-gradient(ellipse_60%_58%_at_50%_45%,black_45%,transparent_100%)]`}
                  />
                  {/* Velo marino desde abajo para que el texto blanco se lea sobre cualquier foto. */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-marca-marino via-marca-marino/10 to-transparent"
                  />
                  <div className="relative flex flex-col items-start gap-sp-12 pb-sp-8">
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
      <div aria-hidden="true" className={FUNDIDO_DESDE_MARINO} />
    </section>
  );
}
