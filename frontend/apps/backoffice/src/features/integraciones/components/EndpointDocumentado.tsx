import type { EndpointDoc } from '../documentacion';
import { BloqueCodigo } from './BloqueCodigo';

/** Un endpoint: método y ruta, parámetros, ejemplos de respuesta, códigos y un curl. */
export function EndpointDocumentado({ endpoint }: { endpoint: EndpointDoc }) {
  const idTitulo = `endpoint-${endpoint.id}`;
  return (
    <article aria-labelledby={idTitulo} className="flex flex-col gap-sp-16">
      <header className="flex flex-col gap-sp-8">
        <h3 id={idTitulo} className="text-h3 text-text-primary">
          {endpoint.titulo}
        </h3>
        <p className="text-body-sm text-text-secondary">{endpoint.descripcion}</p>
        <p className="flex flex-wrap items-center gap-sp-8 font-mono text-body-sm text-text-primary">
          <span className="rounded-pill bg-accent-lime-soft px-sp-12 py-sp-4 text-label">
            {endpoint.metodo}
          </span>
          <span>{endpoint.ruta}</span>
        </p>
      </header>

      <section aria-label={`Parámetros de ${endpoint.titulo}`} className="flex flex-col gap-sp-8">
        <h4 className="text-label text-text-primary">Parámetros</h4>
        <dl className="m-0 flex flex-col gap-sp-8">
          {endpoint.parametros.map((parametro) => (
            <div key={parametro.nombre} className="flex flex-col gap-sp-4 sm:flex-row sm:gap-sp-16">
              <dt className="min-w-[140px] font-mono text-body-sm text-text-primary">
                {parametro.nombre}
              </dt>
              <dd className="m-0 text-body-sm text-text-secondary">{parametro.detalle}</dd>
            </div>
          ))}
        </dl>
      </section>

      {endpoint.cuerpoPedido ? (
        <section className="flex flex-col gap-sp-8">
          <h4 className="text-label text-text-primary">Cuerpo del pedido (JSON)</h4>
          <BloqueCodigo
            etiqueta={`Cuerpo del pedido de ${endpoint.titulo}`}
            codigo={endpoint.cuerpoPedido}
          />
        </section>
      ) : null}

      {endpoint.ejemplos.map((ejemplo) => (
        <section key={ejemplo.titulo} className="flex flex-col gap-sp-8">
          <h4 className="text-label text-text-primary">{ejemplo.titulo}</h4>
          <BloqueCodigo
            etiqueta={`${ejemplo.titulo} de ${endpoint.titulo}`}
            codigo={ejemplo.json}
          />
        </section>
      ))}

      <section
        aria-label={`Códigos de respuesta de ${endpoint.titulo}`}
        className="flex flex-col gap-sp-8"
      >
        <h4 className="text-label text-text-primary">Códigos de respuesta</h4>
        <ul className="m-0 flex list-none flex-col gap-sp-4 p-0">
          {endpoint.respuestas.map((respuesta) => (
            <li key={respuesta.codigo} className="flex gap-sp-16 text-body-sm">
              <span className="min-w-[48px] font-mono text-text-primary">{respuesta.codigo}</span>
              <span className="text-text-secondary">{respuesta.cuando}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-sp-8">
        <h4 className="text-label text-text-primary">Ejemplo con curl</h4>
        <BloqueCodigo etiqueta={`curl de ${endpoint.titulo}`} codigo={endpoint.curl} />
      </section>
    </article>
  );
}
