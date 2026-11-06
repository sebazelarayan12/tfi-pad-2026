import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import type { ReactNode } from 'react';

import { renderAnchor, type RenderLink } from '../Button/enlace';

/** Acción de la tarjeta: un botón (`onClick`) o un enlace (`href`, con `renderLink` del router). */
export type CardWidgetAction =
  { label: string; onClick: () => void } | { label: string; href: string; renderLink?: RenderLink };

export interface CardWidgetProps {
  title: string;
  /** Ícono decorativo a la izquierda del título (Phosphor 20 px). */
  icon?: ReactNode;
  action?: CardWidgetAction;
  children: ReactNode;
}

const FOCO =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary';

const ACCION = `inline-flex items-center gap-sp-4 text-label text-text-primary ${FOCO}`;

function AccionCard({ action }: { action: CardWidgetAction }) {
  const contenido = (
    <>
      <span aria-hidden="true" className="inline-flex">
        <ArrowUpRightIcon size={16} weight="regular" />
      </span>
      {action.label}
    </>
  );

  if ('href' in action) {
    const renderLink = action.renderLink ?? renderAnchor;
    return <>{renderLink({ href: action.href, className: ACCION, children: contenido })}</>;
  }

  return (
    <button type="button" onClick={action.onClick} className={ACCION}>
      {contenido}
    </button>
  );
}

/**
 * Tarjeta con título y acción opcional (`design-system §5.13`).
 * El título es `h3` (D-T07-3); sin `action` no se renderiza botón ni enlace.
 */
export function CardWidget({ title, icon, action, children }: CardWidgetProps) {
  return (
    <section className="flex flex-col gap-sp-16 rounded-card border border-border-hairline bg-surface-panel p-sp-20">
      <div className="flex items-center justify-between gap-sp-8">
        <div className="flex items-center gap-sp-8">
          {icon ? (
            <span aria-hidden="true" className="inline-flex text-text-primary">
              {icon}
            </span>
          ) : null}
          <h3 className="text-h3 text-text-primary">{title}</h3>
        </div>
        {action ? <AccionCard action={action} /> : null}
      </div>
      <div className="text-body-sm text-text-secondary">{children}</div>
    </section>
  );
}
