export interface PublicFooterContacto {
  label: string;
  value: string;
}

export interface PublicFooterProps {
  contacto: ReadonlyArray<PublicFooterContacto>;
  copyright: string;
  /** Para anclar la sección (por ejemplo `#contacto`). */
  id?: string;
}

/** Pie de la web pública (`design-system §5.11`). Los textos llegan por props. */
export function PublicFooter({ contacto, copyright, id }: PublicFooterProps) {
  return (
    <footer
      id={id}
      className="flex flex-col gap-sp-24 rounded-card bg-surface-sidebar px-sp-24 py-sp-32 md:px-sp-40"
    >
      {contacto.length > 0 ? (
        <div className="flex flex-wrap gap-x-sp-48 gap-y-sp-24">
          {contacto.map((dato) => (
            <dl key={dato.label} className="flex flex-col gap-sp-4">
              <dt className="text-caption text-text-tertiary">{dato.label}</dt>
              <dd className="text-body-sm text-text-primary">{dato.value}</dd>
            </dl>
          ))}
        </div>
      ) : null}
      <p className="text-caption text-text-tertiary">{copyright}</p>
    </footer>
  );
}
