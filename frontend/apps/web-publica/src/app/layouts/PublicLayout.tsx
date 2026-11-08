import { Backdrop, PublicFooter, PublicNav, Shell } from '@nexa/ui';
import { Outlet } from 'react-router-dom';

import { renderLinkRouter } from '../../shared/enlace/renderLinkRouter';
import { CONTACTO_PUBLICO, COPYRIGHT_PUBLICO } from './contenidoPublico';

// Destinos propuestos en W1 §8 (NO DEFINIDOS en el Figma, T-18 §13.1).
const LINKS_PUBLICOS = [
  { label: 'Planes', href: '#planes' },
  { label: 'Contacto', href: '#contacto' },
] as const;
const CTA_LABEL = 'Consultar póliza';
const CTA_HREF = '/consultar-poliza';

/**
 * Marco de la web pública: Backdrop, Shell, nav, contenido de la ruta y pie.
 * Como en el Figma (W1 18:201, W2 18:90), el Shell ocupa al menos el alto de la ventana, el
 * contenido crece entre la nav y el pie, y no hay separación extra entre ellos (V-06).
 */
export function PublicLayout() {
  return (
    <Backdrop>
      <div className="flex min-h-dvh flex-col p-sp-16 md:p-sp-24">
        <Shell className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col p-sp-16 md:p-sp-24">
            <PublicNav
              links={LINKS_PUBLICOS}
              ctaLabel={CTA_LABEL}
              ctaHref={CTA_HREF}
              renderLink={renderLinkRouter}
            />
            <main id="contenido" className="flex flex-1 flex-col">
              <Outlet />
            </main>
            <PublicFooter id="contacto" contacto={CONTACTO_PUBLICO} copyright={COPYRIGHT_PUBLICO} />
          </div>
        </Shell>
      </div>
    </Backdrop>
  );
}
