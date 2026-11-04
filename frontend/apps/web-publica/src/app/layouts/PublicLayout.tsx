import { Backdrop, PublicFooter, PublicNav, Shell } from '@nexa/ui';
import { Outlet } from 'react-router-dom';

// Textos literales de W1 §5. "A confirmar" es texto provisional del diseño (W1 §13 #10).
export const CONTACTO_PUBLICO = [
  { label: 'Teléfono', value: 'A confirmar' },
  { label: 'Email', value: 'A confirmar' },
  { label: 'Ubicación', value: 'Dirección a confirmar' },
  { label: 'Horarios', value: 'Lunes a viernes, horario a confirmar' },
] as const;
export const COPYRIGHT_PUBLICO = '© 2026 Nexa Seguros. Todos los derechos reservados.';

// Destinos propuestos en W1 §8 (NO DEFINIDOS en el Figma, T-18 §13.1).
const LINKS_PUBLICOS = [
  { label: 'Planes', href: '#planes' },
  { label: 'Contacto', href: '#contacto' },
] as const;
const CTA_LABEL = 'Consultar póliza';
const CTA_HREF = '/consultar-poliza';

/** Marco de la web pública: Backdrop, Shell, nav, contenido de la ruta y pie. */
export function PublicLayout() {
  return (
    <Backdrop>
      <div className="p-sp-16 md:p-sp-24">
        <Shell>
          <div className="flex flex-col gap-sp-24 p-sp-16 md:p-sp-24">
            <PublicNav links={LINKS_PUBLICOS} ctaLabel={CTA_LABEL} ctaHref={CTA_HREF} />
            <main id="contenido">
              <Outlet />
            </main>
            <PublicFooter id="contacto" contacto={CONTACTO_PUBLICO} copyright={COPYRIGHT_PUBLICO} />
          </div>
        </Shell>
      </div>
    </Backdrop>
  );
}
