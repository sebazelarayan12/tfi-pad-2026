import type { ClienteResponse } from '@nexa/api';
import { Dato } from '@nexa/ui';

/** Pestaña Datos en modo lectura (D-B07-5): contacto y domicilio. Editar lo agrega B-08. */
export function DatosClienteLectura({ cliente }: { cliente: ClienteResponse }) {
  return (
    <div className="flex flex-col gap-sp-24 pt-sp-24">
      <section aria-label="Contacto" className="flex flex-col gap-sp-16">
        <h2 className="text-h3 text-text-primary">Contacto</h2>
        <div className="grid grid-cols-1 gap-sp-16 sm:grid-cols-2">
          <Dato label="Email" value={cliente.email} />
          <Dato label="Teléfono" value={cliente.telefono} />
        </div>
      </section>
      <section aria-label="Domicilio" className="flex flex-col gap-sp-16">
        <h2 className="text-h3 text-text-primary">Domicilio</h2>
        <div className="grid grid-cols-1 gap-sp-16 sm:grid-cols-2">
          <Dato label="Calle" value={cliente.calle} />
          <Dato label="Número" value={cliente.numero} />
          <Dato label="Localidad" value={cliente.localidad} />
          <Dato label="Provincia" value={cliente.provincia} />
          <Dato label="Código postal" value={cliente.codigoPostal} />
        </div>
      </section>
    </div>
  );
}
