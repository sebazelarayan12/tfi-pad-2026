import { Outlet } from 'react-router-dom';

import { CONTENEDOR } from '../../marca/estilos';
import { CONTACTO_PUBLICO, COPYRIGHT_PUBLICO } from './contenidoPublico';
import { NavPublica } from './NavPublica';
import { PiePublico } from './PiePublico';

const LINKS_PUBLICOS = [
  { label: 'Planes', href: '/#planes' },
  { label: 'Contacto', href: '/#contacto' },
] as const;
const CTA_LABEL = 'Consultar póliza';
const CTA_HREF = '/consultar-poliza';

/**
 * Marco de la web pública con la identidad Nexa Seguros: página a todo el ancho (sin el
 * panel flotante anterior), nav fija arriba, contenido de la ruta y pie de contacto.
 * El contenido va en el contenedor de 1440 px; `overflow-x-clip` deja que las fotos de la home
 * salgan a todo el ancho (`ANCHO_COMPLETO`) sin scroll lateral.
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-white">
      <NavPublica links={LINKS_PUBLICOS} ctaLabel={CTA_LABEL} ctaHref={CTA_HREF} />
      <main id="contenido" className={`${CONTENEDOR} flex flex-1 flex-col`}>
        <Outlet />
      </main>
      <PiePublico id="contacto" contacto={CONTACTO_PUBLICO} copyright={COPYRIGHT_PUBLICO} />
    </div>
  );
}
