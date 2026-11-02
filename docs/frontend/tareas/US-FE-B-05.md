# US-FE-B-05: Alta de cliente: formulario

Tipo: B · Oleada: 5 · Tamaño: M · Rama sugerida: `feature/US-FE-B-05-alta-cliente` · Tarjeta Trello: `US-FE-B-05`

Pantalla: [B4 Nuevo cliente](../pantallas/B4-nuevo-cliente.md). Índice: [INDEX](INDEX.md), fila US-FE-B-05.

---

## 1. Objetivo

El empleado o el administrador carga los datos de un cliente nuevo (datos personales, contacto y domicilio) en `/clientes/nuevo`, el formulario valida lo mismo que el back antes de enviar, y `POST /api/clientes` crea el cliente. Al guardar con éxito vuelve a `/clientes` con un aviso. Esta tarea **no** llama a Renaper y **no** muestra el botón "Validar en Renaper" ni el rail: eso es **US-FE-B-06**. Para: empleados y administradores.

## 2. Alcance

**Entra**
- Ruta `/clientes/nuevo` en `features/clientes/routes.tsx` (bloque estático, antes de la dinámica de B-07, FC14).
- `AltaClientePage` con enlace "Clientes", título "Nuevo cliente", tres grupos (`fieldset`) y acciones.
- Esquema zod del alta, normalización (DNI y CUIL sin separadores, fecha `yyyy-MM-dd`) y mapeo de errores.
- `POST /api/clientes`: 201 (redirige con aviso), 400 por campo (`errors`), 400 de negocio (`detail`), 5xx y sin conexión.
- Confirmación al cancelar con cambios.

**NO entra**
- Botón "Validar en Renaper", consulta `GET /api/clientes/renaper/{dni}`, precarga del formulario y rail "Validación Renaper": **US-FE-B-06**.
- Reintento de validación `POST /api/clientes/{id}/validar-renaper`: **US-FE-B-08** (ficha). Ver sección 13, D-B05-6.
- Listado que muestra el aviso de alta: **US-FE-B-04** (consume `location.state.aviso`, RV-41).
- Request y DTO de alta y handler MSW: **US-FE-T-25**. Mensajes de error y mapa de códigos: **US-FE-T-10**.
- Primitivos `Input`, `Select`, `Button`, `AlertaError`: T-04, T-05, T-07.
- Ficha de cliente y edición: B-07 y B-08.

## 3. Dependencias

- **Oleada:** 5.
- **Depende de:** US-FE-B-04, US-FE-T-04, US-FE-T-05, US-FE-T-07, US-FE-T-10, US-FE-T-11, US-FE-T-16, US-FE-T-19, US-FE-T-25.
- **Puede empezar sin esperar a:** merge antes que US-FE-B-07 (routes.tsx, RV-39).
- **Bloqueada por pedidos al back:** PB-14, PB-15, PB-29 (degradan; ver sección 7).

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (reglas 1 a 5), FB4 (fechas y DNI), FB5, FB7.7, FB7.11.
- `docs/frontend/pantallas/B4-nuevo-cliente.md`: §2 (ruta), §3 (estructura de la columna principal; no el rail), §4 (componentes), §5 (contenido literal), §6 (campos y reglas, tabla completa y copy de error), §7 (estados de guardado y de error, solo las filas de alta), §8 (acciones "Cancelar" y "Guardar cliente"), §9 (`POST /api/clientes`), §10 (RN01, RN02, RN16), §11 (responsive), §12 (accesibilidad), §13 (D-1, D-3 solo como nota, D-7, D-8, D-10, D-11, D-12, D-13, D-15, D-17, D-18, D-19).
- `docs/frontend/contratos-api/seguridad-clientes-publico.md`: §1.2 (claves PascalCase en `errors`), §3.1 (`ClienteAltaRequest`, `ClienteResponse`, reglas de 400 por orden), §4.1 (formatos de DNI y CUIL).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §3.3 (validación por campo), §5.3 (fechas `DateOnly`).
- `docs/frontend/design-system.md`: §5.2 (Input, estados y helper), §5.3 (Select y placeholder), §5.1 (Button Primary M y Secondary M), §8.2 (error de Input y Select), §8.3 (foco).
- `docs/frontend/pedidos-al-back.md`: PB-14, PB-15, PB-29.
- `docs/frontend/tareas/INDEX.md`: FC9 (fechas y DNI), FC10 (errores), FC11 (mutación sensible), FC16 (accesibilidad).

## 5. Archivos a crear o modificar

Bajo `frontend/apps/backoffice/src/features/clientes/` (dueño B-05 para los nuevos; B-04 es dueño de `routes.tsx` e `index.ts`):

| Archivo | Notas |
|---|---|
| `pages/AltaClientePage.tsx` | Compone el formulario. Sin rail (B-06 lo agrega). |
| `components/FormularioAltaCliente.tsx` | `useForm` con `zodResolver`. Tres `fieldset`. |
| `components/SeccionDatosPersonales.tsx`, `SeccionContacto.tsx`, `SeccionDomicilio.tsx` | Campos de cada grupo. |
| `components/ConfirmarDescarte.tsx` | Contenido de la confirmación al cancelar con cambios, sobre `Dialogo` de `@nexa/ui` (T-07, RV-D05). |
| `schemas/altaClienteSchema.ts` | Esquema zod. Fuente del tipo `AltaClienteFormValues`. |
| `schemas/provincias.ts` | Lista fija de 24 jurisdicciones (D-B05-5). Dueño B-05 (RV-10). |
| `schemas/normalizarAltaCliente.ts` | Pasa de valores del form a `ClienteAltaRequest`. |
| `api/useAltaCliente.ts` | `useMutation({ mutationFn, retry: 0 })`. |
| `api/mapearErroresAlta.ts` | Convierte `ProblemDetails` / `ValidationProblemDetails` en errores por campo o alerta general. |
| `routes.tsx` | Agrega `/clientes/nuevo` antes de cualquier ruta dinámica. Dueño: B-04; B-05 agrega su bloque. Merge antes que B-07 (RV-39). |
| Tests | `pages/AltaClientePage.test.tsx`, `schemas/altaClienteSchema.test.ts`, `api/mapearErroresAlta.test.ts`. |

Compartidos (no editar): `packages/api/src/dto/clientes.ts` y request de alta (T-25); `packages/api/src/messages/*` (T-10); `packages/ui/**`; `app/**`.

## 6. Pasos de implementación

1. Confirmar que B-04, T-04, T-05, T-07, T-10, T-11, T-16, T-19 y T-25 están mergeadas, y que esta tarea se mergea antes que B-07 (routes.tsx, RV-39). Leer `ClienteAltaRequest`, `ClienteResponse`, la función de alta y el mapa de mensajes (los nombres de §7 son sugeridos).
2. Crear `provincias.ts` con las 24 jurisdicciones de §8 en ese orden.
3. Crear `altaClienteSchema.ts` con las reglas de §9 (campo por campo, copy de §8). Usar `z.string().trim()` y regex para DNI y CUIL. El tipo es `z.infer`.
4. Crear `normalizarAltaCliente.ts`: `dni` y `cuil` solo dígitos; `fechaNacimiento` de `dd/mm/aaaa` a `yyyy-MM-dd`; `sexo` como un carácter; `telefono` vacío a `null`.
5. Crear `useAltaCliente`: `retry: 0`. Al éxito, navega a `/clientes` con `state: { aviso: { tipo, texto } }` (RV-41, sección 8).
6. Crear `mapearErroresAlta.ts`: si hay `errors`, mapear cada clave (insensible a mayúsculas) al campo; si una clave no existe, va a la alerta general. Si no hay `errors`, la alerta general usa `detail` sin prefijo `RN\d\d:`.
7. `SeccionDatosPersonales`: DNI (`inputMode="numeric"`, acepta puntos), Sexo (`Select`), Nombre, Apellido, CUIL (máscara `XX-XXXXXXXX-X`), Fecha de nacimiento (texto `dd/mm/aaaa`, ayuda `Debe ser mayor de 18 años.`). Pares de dos columnas con `gap` 16 px.
8. `SeccionContacto`: Email y Teléfono (`type="tel"`).
9. `SeccionDomicilio`: Calle y Número; Localidad y Provincia (`Select`); Código postal.
10. Cada `fieldset` tiene `legend` con el título del grupo.
11. Acciones: "Cancelar" (Secondary M) y "Guardar cliente" (Primary M). Guardar se deshabilita y se marca `aria-busy` durante la mutación; el resto de campos también queda `disabled`.
12. Al enviar con errores de zod, el foco va al primer campo con error (FC16).
13. Escribir los tests de §10 antes de los componentes; correr `lint`, `typecheck`, `test`, `build`.

## 7. Contrato con el back

| Método y ruta | Estado | Request | Response 201 | Errores |
|---|---|---|---|---|
| `POST /api/clientes` | En PR #50 (no mergeado; MSW de T-25) | `ClienteAltaRequest` | `ClienteResponse` + `Location` | 400 (`errors` o `detail`), 401, 403. Renaper caído no es error: 201 con `validadoRenaper=false` |

```ts
// Tipos en @nexa/api (dueño US-FE-T-25). No redefinir.
export type SexoCliente = 'M' | 'F' | 'X';

export interface ClienteAltaRequest {
  dni: string;               // 8 dígitos, sin puntos
  email: string;             // máx. 150
  telefono?: string | null;  // máx. 20
  nombre: string;            // máx. 100
  apellido: string;          // máx. 100
  cuil: string;              // 11 dígitos, sin guiones
  fechaNacimiento: string;   // "yyyy-MM-dd"
  sexo: SexoCliente;         // un carácter
  calle: string;             // máx. 150
  numero: string;            // máx. 20 (texto, no solo números)
  localidad: string;         // máx. 100
  provincia: string;         // máx. 100, texto libre
  codigoPostal: string;      // máx. 10
}

export interface ClienteResponse {
  id: string;
  dni: string;
  cuil: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  sexo: SexoCliente;
  email: string;
  telefono: string | null;
  calle: string;
  numero: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  validadoRenaper: boolean;
  fechaValidacionRenaper: string | null;
  activo: boolean;
}
```

- Claves de `errors` en PascalCase (`Dni`, `Email`, `Cuil`, `FechaNacimiento`, `CodigoPostal`, etc.). Contrato §1.2 B. B4 §6 pedía confirmarlo; se mapean sin distinguir mayúsculas hasta que se confirme.
- 400 de negocio sin `codigo` (PB-14): `detail` en español con prefijo `RN01:` o `RN02:` (se quita el prefijo) o `El DNI '{dni}' no figura en Renaper.`.
- Handler MSW: **No aplica** en esta tarea. T-25 lo escribe. Las pruebas de error usan `server.use`.
- Query keys: no hay queries. Al éxito se invalida `clientesKeys.lista` (T-24) para que el listado muestre el alta.

## 8. Contenido de UI

Textos literales de B4 §5, más el copy propuesto (marcado) para lo que el diseño no define.

| Zona | Texto |
|---|---|
| Enlace de volver | `Clientes` (con icono `arrow-left` decorativo) |
| Título | `Nuevo cliente` |
| Grupo 1 | `Datos personales` |
| Grupo 2 | `Contacto` |
| Grupo 3 | `Domicilio` |
| Labels | `DNI` · `Sexo` · `Nombre` · `Apellido` · `CUIL` · `Fecha de nacimiento` · `Email` · `Teléfono` · `Calle` · `Número` · `Localidad` · `Provincia` · `Código postal` |
| Ayuda de fecha | `Debe ser mayor de 18 años.` |
| Opciones de Sexo (propuesta, B4 D-11) | `Femenino` (F) · `Masculino` (M) · `X` (X) |
| Placeholder de select | `Seleccioná una opción` (design-system §5.3) |
| Acciones | `Cancelar` · `Guardar cliente` |
| Error DNI (propuesta, copy del back) | `El DNI debe tener 8 dígitos.` |
| Errores de negocio (DNI o email duplicados, menor de 18, fallecido, no figura en Renaper) | Se muestra el `detail` del back sin prefijo `RNxx:` en la alerta general; no se marca ningún campo (FC10). No hay copy propio para estos casos. |
| Error CUIL (copy del back) | `El CUIL debe tener 11 dígitos.` |
| Error nombre / apellido (propuesta) | `Ingresá el nombre.` · `Ingresá el apellido.` |
| Error fecha (back) | `La fecha de nacimiento es obligatoria.` |
| Error fecha inválida (propuesta) | `Ingresá una fecha válida.` |
| Error menor de edad (propuesta; back RN01) | `El cliente debe tener 18 años o más.` |
| Error email (propuesta) | `Ingresá el email.` · `El email no tiene un formato válido.` |
| Error sexo (propuesta) | `Elegí el sexo.` |
| Error calle / número / localidad / código postal (propuesta) | `Ingresá la calle.` · `Ingresá el número.` · `Ingresá la localidad.` · `Ingresá el código postal.` |
| Error provincia (propuesta) | `Elegí la provincia.` |
| Error general de red o 5xx (propuesta) | `No pudimos guardar el cliente. Revisá los datos e intentá de nuevo.` |
| Aviso al guardar con Renaper (201, validado) | `Cliente guardado.` (propuesta de B4 §7) |
| Aviso al guardar sin Renaper (201, `validadoRenaper=false`) | `Cliente guardado sin validar en Renaper.` (propuesta de B4 §7) |
| Confirmación al cancelar con cambios (propuesta) | Título `¿Descartar los datos cargados?` · botones `Seguir editando` y `Descartar` |

Provincias (propuesta, B4 D-6), en este orden: Buenos Aires, Catamarca, Chaco, Chubut, Ciudad Autónoma de Buenos Aires, Córdoba, Corrientes, Entre Ríos, Formosa, Jujuy, La Pampa, La Rioja, Mendoza, Misiones, Neuquén, Río Negro, Salta, San Juan, San Luis, Santa Cruz, Santa Fe, Santiago del Estero, Tierra del Fuego, Tucumán (24 opciones).

**No renderizar:** `35.874.219`, `F`, `Lucía`, `Benítez`, `27-35874219-6`, `14/02/1991`, `lucia.benitez@correo.com`, `381 555 0148`, `Av. Mate de Luna`, `1450`, `San Miguel de Tucumán`, `Tucumán`, `4000` (muestras de B4 §5). Tampoco "Ejemplo de error" (anotación).

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Inicial | Campos vacíos, "Guardar cliente" habilitado. |
| Campo inválido | `Input` o `Select` en estado error con `helper` del copy de §8 y `aria-invalid`. |
| Reglas de DNI | Acepta `35.874.219` y `35874219`; después de quitar puntos y espacios, exactamente 8 dígitos. |
| Reglas de CUIL | Máscara `XX-XXXXXXXX-X` mientras se escribe; 11 dígitos al enviar. |
| Fecha | Formato `dd/mm/aaaa`; fecha real; mayor de 18 años con la fecha de hoy en `America/Argentina/Buenos_Aires` (regla de D-B05-4). |
| Email | Trim, formato, máximo 150. |
| Teléfono vacío | Permitido (`null`). |
| Enviando | Todos los campos y "Guardar cliente" deshabilitados; un solo POST aunque hagan doble clic. |
| 201 con `validadoRenaper=true` | Navega a `/clientes` con aviso de éxito. |
| 201 con `validadoRenaper=false` | Navega a `/clientes` con aviso de advertencia. |
| 400 con `errors` | Marca cada campo que coincide; el resto va a la alerta general. Los datos se conservan. |
| 400 con `detail` (negocio) | Alerta general con el `detail` sin `RNxx:`. Ningún campo se marca (FC10). |
| 5xx o sin conexión | Alerta general del copy de §8. Datos conservados. No se reintenta. |
| 401 | Lo maneja T-08 (redirige a `/login`). |
| Cancelar sin cambios | Navega a `/clientes`. |
| Cancelar con cambios | Abre `ConfirmarDescarte`. "Descartar" navega; "Seguir editando" cierra. |
| Foco al enviar con errores | Primer campo inválido. |
| Foco tras error de negocio | Alerta general (`role="alert"`). |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, MSW (`server.use` para cada error).

| Test | Qué afirma |
|---|---|
| `tiene tres grupos con legend Datos personales, Contacto y Domicilio` | Estructura y textos. |
| `todos los campos tienen label visible y ninguno usa placeholder como label` | `getByLabelText`. |
| `DNI vacío muestra "El DNI debe tener 8 dígitos." y no llama a la API` | Regla requerida. |
| `DNI de 7 dígitos es inválido; 35.874.219 es válido` | Regla de formato y de puntos. |
| `CUIL con máscara se envía con 11 dígitos` | Normalización. |
| `CUIL de 10 dígitos muestra "El CUIL debe tener 11 dígitos."` | Regla. |
| `nombre y apellido vacíos muestran sus textos de §8` | Requeridos. |
| `fecha inválida muestra "Ingresá una fecha válida."` | Formato real. |
| `fecha que da menos de 18 años muestra "El cliente debe tener 18 años o más."` | Regla de edad con reloj fijo. |
| `la fecha se envía como yyyy-MM-dd` | Normalización. |
| `email inválido muestra "El email no tiene un formato válido."` | Regla. |
| `teléfono vacío se envía como null` | Normalización. |
| `sexo sin elegir muestra "Elegí el sexo." y sus opciones son Femenino, Masculino y X` | Opciones. |
| `provincia tiene 24 opciones en el orden de §8` | Lista fija. |
| `código postal y número vacíos muestran sus textos` | Requeridos. |
| `el body del POST tiene las claves y tipos de ClienteAltaRequest` | Captura del body con MSW. |
| `201 con validadoRenaper=true navega a /clientes con aviso de éxito` | `location.state`. |
| `201 con validadoRenaper=false navega a /clientes con aviso de advertencia` | Texto de §8. |
| `400 con errors.Dni marca el campo DNI con aria-invalid y aria-describedby` | Mapeo por clave en PascalCase. |
| `400 con clave en mayúsculas distinta no rompe el mapeo` | Insensible a mayúsculas. |
| `400 con detail "RN01: Ya existe un cliente con el DNI..." muestra el texto sin RN01 y no marca el campo` | Regla de FC10. |
| `400 con textos en inglés de errors no los muestra` | PB-15. |
| `5xx muestra la alerta general y conserva los datos` | Estado de error. |
| `sin conexión muestra la alerta general` | `HttpResponse.error()`. |
| `durante el envío hay un solo POST con doble clic` | FC11. |
| `cancelar con cambios abre el diálogo; Descartar navega` | Confirmación. |
| `cancelar sin cambios navega sin diálogo` | Caso borde. |
| `al enviar con errores el foco va al primer campo inválido` | FC16. |
| `no tiene violaciones de accesibilidad` | Helper de US-FE-T-19 (axe). |

## 11. Criterios de aceptación

1. `/clientes/nuevo` muestra el título `Nuevo cliente`, el enlace `Clientes` y tres grupos con `legend`.
2. Cada campo tiene label visible; ninguno usa placeholder como label.
3. DNI acepta puntos y se envía con 8 dígitos; CUIL se envía con 11 dígitos.
4. Cada regla de validación de §9 muestra su copy de §8 y no llama a la API si falla.
5. La fecha se escribe `dd/mm/aaaa` y se envía `yyyy-MM-dd`; menor de 18 años bloquea el envío.
6. Sexo ofrece Femenino (F), Masculino (M) y X; Provincia ofrece las 24 jurisdicciones de §8.
7. Teléfono vacío se envía como `null`.
8. El POST es a `/api/clientes` con el body de `ClienteAltaRequest`, un solo envío aunque haya doble clic.
9. 201 navega a `/clientes` con `aviso` de éxito si `validadoRenaper=true`, o de advertencia si es `false`.
10. 400 con `errors` marca el campo correspondiente con `aria-invalid="true"` y `aria-describedby`; 400 con `detail` muestra el texto sin prefijo `RNxx:` y no marca campos.
11. Ningún texto en inglés del back se muestra en pantalla.
12. 5xx y sin conexión muestran la alerta general sin perder los datos.
13. Cancelar con cambios pide confirmación; sin cambios navega directo.
14. Al enviar con errores, el foco va al primer campo inválido.
15. La pantalla no muestra el botón "Validar en Renaper" ni el rail (lo agrega B-06).
16. Los tests de §10 están en verde y el test de axe no tiene violaciones.
17. `npm run lint`, `typecheck`, `test` y `build` están en verde en `apps/backoffice`.

## 12. Verificación manual

Requiere el back con PR #50 o `VITE_USE_MOCKS=true` (T-25).

1. Abrir `/clientes/nuevo`. Ver tres grupos y los campos vacíos.
2. Enviar sin datos. Ver los mensajes y el foco en el DNI.
3. Escribir DNI `35.874.219`, fecha `14/02/2010` (menor de 18), y enviar. Ver el mensaje de edad y ningún envío.
4. Completar con datos válidos y enviar. Ver `/clientes` con el aviso de éxito.
5. Repetir con un DNI ya cargado. Ver el mensaje general sin marcar el DNI.
6. Confirmar con la persona responsable los pasos 4 y 5 antes del PR (workflow regla 7).

## 13. Decisiones pendientes (con default)

- **D-B05-1. Textos de validación (B4 D-7).** Default: los de §8 (propuesta). El back devuelve textos en inglés (PB-15); no se usan.
- **D-B05-2. Opciones de sexo (B4 D-11).** Default: `Femenino`, `Masculino`, `X`. Confirmar con diseño.
- **D-B05-3. Confirmación al cancelar (B4 D-15).** Default: `Dialogo` de `@nexa/ui` (T-07, RV-D05) con `role="alertdialog"` y foco en "Seguir editando". B-08 y B-23 lo importan de ahí (D-37 del INDEX).
- **D-B05-4. Edad mínima en el front (B4 D-10).** Default: el front bloquea el envío a menores de 18 con la fecha cargada, porque el back usa esa misma regla cuando no hay Renaper (esta tarea no consulta Renaper). B4 D-10 propone solo avisar; FB8 (RV-D20) fija el bloqueo. Si cambia, la validación pasa a aviso y el back decide.
- **D-B05-5. Lista de provincias (B4 D-6).** Default: las 24 jurisdicciones de §8, como texto libre guardado. Sin catálogo en el back.
- **D-B05-6. Reintento de validación Renaper en el alta (B4 D-9 y B-08).** Default: no hay reintento en el alta. Tras guardar con `validadoRenaper=false`, el empleado reintenta desde la ficha (B-08, RV-38). B-06 no lo incluye.
- **D-B05-7. Selector de fecha (B4 §5 y D-10).** Default: campo de texto con formato `dd/mm/aaaa` y ayuda, sin selector. Confirmar con diseño.
- **D-B05-8. Número y código postal solo números (B4 D-12).** Default: texto libre (el back lo acepta como texto).
- **D-B05-9. Teléfono (B4 D-13).** Default: texto libre, máximo 20, sin validación de formato.
- **D-B05-10. Piso y departamento (B4 D-17).** Default: no se piden en el alta (el diseño no los tiene). Si Renaper devuelve piso o depto, se pierden al guardar; ver B-06.

## 14. Riesgos y errores comunes

- **Enviar el DNI o el CUIL con puntos o guiones:** el back exige 8 y 11 dígitos. Normalizar en un solo lugar (`normalizarAltaCliente`).
- **Enviar la fecha en `dd/mm/aaaa`:** el back espera `yyyy-MM-dd`.
- **Marcar campos por texto de `detail`:** el back no lo indica; hacerlo lleva a errores si cambia la redacción. Solo se marcan campos por `errors`.
- **Mostrar el texto del back:** en inglés en `errors`, con prefijo `RN01:` en `detail`. Ver PB-14 y PB-15.
- **Doble envío:** deshabilitar el botón y `retry: 0` (FC11).
- **Edad calculada con la fecha del navegador en otra zona:** usar la fecha de Argentina (un formateador de T-09).
- **Enviar `sexo` como texto largo:** `sexo` es un carácter.
- **Estado tras éxito:** invalidar `clientesKeys.lista` antes de navegar, o el listado muestra datos viejos.
- **Enum o `null` mal tipados:** `telefono` puede ser `null` pero no `""` en el envío.

## 15. Definición de terminado

- `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde en `apps/backoffice`.
- Sin secretos ni credenciales en el código.
- Accesibilidad revisada con el helper de US-FE-T-19 en `/clientes/nuevo`.
- Sin datos de muestra fijos, sin `any`, sin formateo manual de fechas, DNI o CUIL.
- Criterios de §11 tildados con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-38): el reintento `POST .../validar-renaper` no está en el alta (necesita `id`); sale de la ficha (B-08). El INDEX de B-06 ya no lo lista.
- Resuelto (RV-41): esta tarea produce `location.state.aviso` con `{ tipo, texto }`; B-04 lo muestra.
- Resuelto (RV-39): B-05 va antes que B-07 en `routes.tsx` (FC14); "Puede empezar" del INDEX queda como "merge antes que".
- Resuelto (REVISION §4, sin acción): T-10 ya está en la fila de B-05 del INDEX.
- Resuelto (RV-D05): el diálogo de cancelar es `Dialogo` de `@nexa/ui` (T-07), no un `DialogoModal` propio.
- Resuelto (RV-10): `provincias.ts` es de B-05; B-08 declara B-05 en sus dependencias.

