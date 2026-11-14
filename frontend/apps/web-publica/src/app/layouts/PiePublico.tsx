import { LogoMarca } from '../../marca/LogoMarca';
import { CONTENEDOR, FOCO } from '../../marca/estilos';
import { Aparecer } from '../../shared/animacion/Aparecer';

export interface DatoContacto {
  label: string;
  value: string;
  /** Si viene, el valor es un enlace (`tel:`, `mailto:` o URL). */
  href?: string;
}

interface PiePublicoProps {
  contacto: ReadonlyArray<DatoContacto>;
  copyright: string;
  /** Ancla de la sección (el link "Contacto" del nav baja hasta acá). */
  id?: string;
}

const TITULO = 'Contacto';
const ENLACE = `rounded-input underline-offset-4 hover:text-marca-celeste hover:underline ${FOCO}`;

/**
 * Pie de la web pública: logo blanco, datos de contacto en columnas y copyright, sobre gris oscuro
 * en los dos modos. Arranca con un corte recto marcado por una línea azul fina, sin fundido.
 */
export function PiePublico({ contacto, copyright, id }: PiePublicoProps) {
  return (
    <footer
      id={id}
      aria-labelledby="titulo-contacto"
      className="scroll-mt-sp-80 border-t-2 border-marca-azul bg-pie-fondo text-pie-texto"
    >
      <div className={`${CONTENEDOR} flex flex-col gap-sp-48 py-sp-64 md:py-sp-80`}>
        <Aparecer className="flex flex-col gap-sp-32 md:flex-row md:items-end md:justify-between">
          <h2 id="titulo-contacto" className="text-titulo-lg text-pie-texto md:text-titulo-xl">
            {TITULO}
          </h2>
          <LogoMarca decorativo blanco className="h-10 w-auto self-start md:h-12 md:self-auto" />
        </Aparecer>
        {contacto.length > 0 ? (
          <dl className="grid grid-cols-1 gap-sp-24 border-t border-pie-borde pt-sp-32 sm:grid-cols-2 lg:grid-cols-4">
            {contacto.map((dato, indice) => (
              // `Aparecer` es un `div`, el agrupador válido de `dt`/`dd` dentro de `dl`.
              <Aparecer
                key={dato.label}
                retardoMs={indice * 100}
                className="flex flex-col gap-sp-4"
              >
                <dt className="text-label text-pie-suave">{dato.label}</dt>
                <dd className="text-body-lg font-medium text-pie-texto">
                  {dato.href ? (
                    <a href={dato.href} className={ENLACE}>
                      {dato.value}
                    </a>
                  ) : (
                    dato.value
                  )}
                </dd>
              </Aparecer>
            ))}
          </dl>
        ) : null}
        <p className="text-label text-pie-suave">{copyright}</p>
      </div>
    </footer>
  );
}
