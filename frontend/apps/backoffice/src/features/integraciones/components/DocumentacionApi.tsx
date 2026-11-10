import {
  ENDPOINTS,
  EJEMPLO_ERROR,
  EJEMPLO_JAVASCRIPT,
  HEADER_API_KEY,
  URL_BASE_API,
} from '../documentacion';
import { BloqueCodigo } from './BloqueCodigo';
import { EndpointDocumentado } from './EndpointDocumentado';

/** Documentación completa de la API externa: autenticación, endpoints, errores y ejemplos. */
export function DocumentacionApi() {
  return (
    <section aria-labelledby="documentacion-api" className="flex flex-col gap-sp-24">
      <div className="flex flex-col gap-sp-8">
        <h2 id="documentacion-api" className="text-h2 text-text-primary">
          Documentación de la API
        </h2>
        <p className="text-body-sm text-text-secondary">
          URL base: <span className="font-mono text-text-primary">{URL_BASE_API}</span>. Las
          respuestas son JSON con nombres de campo en camelCase y fechas yyyy-MM-dd. Todos los
          servicios son de solo consulta, salvo la cotización, que calcula precios sin datos de un
          cliente.
        </p>
      </div>

      <section aria-labelledby="doc-autenticacion" className="flex flex-col gap-sp-8">
        <h3 id="doc-autenticacion" className="text-h3 text-text-primary">
          Autenticación
        </h3>
        <p className="text-body-sm text-text-secondary">
          Todos los pedidos llevan tu clave en el header{' '}
          <span className="font-mono text-text-primary">{HEADER_API_KEY}</span>. Sin el header, o
          con una clave incorrecta o revocada, la API responde 401 con el cuerpo vacío. Hacé las
          llamadas desde tu backend, nunca desde el navegador, para no exponer la clave.
        </p>
        <BloqueCodigo etiqueta="Header de autenticación" codigo={`${HEADER_API_KEY}: <tu clave>`} />
      </section>

      {ENDPOINTS.map((endpoint) => (
        <EndpointDocumentado key={endpoint.id} endpoint={endpoint} />
      ))}

      <section aria-labelledby="doc-errores" className="flex flex-col gap-sp-8">
        <h3 id="doc-errores" className="text-h3 text-text-primary">
          Errores
        </h3>
        <p className="text-body-sm text-text-secondary">
          Los errores de negocio (400 y 404) usan application/problem+json. Leé{' '}
          <span className="font-mono text-text-primary">detail</span> para el motivo. En algunos 404
          viene además un <span className="font-mono text-text-primary">codigo</span> estable (por
          ejemplo CLIENTE_NO_ENCONTRADO) que conviene usar para decidir qué hacer en lugar de
          comparar textos.
        </p>
        <BloqueCodigo etiqueta="Ejemplo de error" codigo={EJEMPLO_ERROR} />
      </section>

      <section aria-labelledby="doc-javascript" className="flex flex-col gap-sp-8">
        <h3 id="doc-javascript" className="text-h3 text-text-primary">
          Ejemplo en JavaScript
        </h3>
        <BloqueCodigo etiqueta="Ejemplo en JavaScript" codigo={EJEMPLO_JAVASCRIPT} />
      </section>
    </section>
  );
}
