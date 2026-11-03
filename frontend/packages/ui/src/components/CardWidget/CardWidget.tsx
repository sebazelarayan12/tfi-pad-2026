import { ArrowUpRightIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

export interface CardWidgetAction {
  label: string;
  onClick: () => void;
}

export interface CardWidgetProps {
  title: string;
  action?: CardWidgetAction;
  children: ReactNode;
}

const FOCO =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary';

/**
 * Tarjeta con título y acción opcional (`design-system §5.13`).
 * El título es `h3` (D-T07-3); sin `action` no se renderiza botón.
 */
export function CardWidget({ title, action, children }: CardWidgetProps) {
  return (
    <section className="flex flex-col gap-sp-16 rounded-card border border-border-hairline bg-surface-panel p-sp-20">
      <div className="flex items-center justify-between">
        <h3 className="text-h3 text-text-primary">{title}</h3>
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className={`inline-flex items-center gap-sp-4 text-label text-text-primary ${FOCO}`}
          >
            <span aria-hidden="true" className="inline-flex">
              <ArrowUpRightIcon size={16} weight="regular" />
            </span>
            {action.label}
          </button>
        ) : null}
      </div>
      <div className="text-body-sm text-text-secondary">{children}</div>
    </section>
  );
}
