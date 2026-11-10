export interface PublicFooterContacto {
  label: string;
  value: string;
  /** Si viene, el valor es un enlace (`tel:`, `mailto:` o URL). */
  href?: string;
}

export interface PublicFooterProps {
  contacto: ReadonlyArray<PublicFooterContacto>;
  copyright: string;
  /** Para anclar la sección (por ejemplo `#contacto`). */
  id?: string;
}

const ENLACE =
  'rounded-input underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary';

/** Pie de la web pública (`design-system §5.11`). Los textos llegan por props. */
export function PublicFooter({ contacto, copyright, id }: PublicFooterProps) {
  return (
    <footer
      id={id}
      className="flex scroll-mt-sp-24 flex-col gap-sp-24 rounded-card bg-surface-sidebar px-sp-24 py-sp-32 md:px-sp-40"
    >
      {contacto.length > 0 ? (
        <div className="flex flex-wrap gap-x-sp-48 gap-y-sp-24">
          {contacto.map((dato) => (
            <dl key={dato.label} className="flex flex-col gap-sp-4">
              <dt className="text-caption text-text-tertiary">{dato.label}</dt>
              <dd className="text-body-sm text-text-primary">
                {dato.href ? (
                  <a href={dato.href} className={ENLACE}>
                    {dato.value}
                  </a>
                ) : (
                  dato.value
                )}
              </dd>
            </dl>
          ))}
        </div>
      ) : null}
      <p className="text-caption text-text-tertiary">{copyright}</p>
    </footer>
  );
}
