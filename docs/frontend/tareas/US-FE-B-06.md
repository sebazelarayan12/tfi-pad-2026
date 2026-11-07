# US-FE-B-06: Alta de cliente: validación previa en Renaper

Tipo: B · Oleada: 6 · Tamaño: S · Rama sugerida: `feature/US-FE-B-06-alta-renaper` · Tarjeta Trello: `US-FE-B-06`

Pantalla: [B4 Nuevo cliente](../pantallas/B4-nuevo-cliente.md). Índice: [INDEX](INDEX.md), fila US-FE-B-06.

---

## 1. Objetivo

En el alta de cliente (`/clientes/nuevo`), el empleado toca "Validar en Renaper" para consultar el DNI antes de guardar. Si Renaper responde, el rail muestra el estado (Vigente o Fallecido), y los datos de Renaper precargan el formulario marcados como "Dato de Renaper". Si el DNI no existe o Renaper no responde, el rail y el campo DNI lo dicen con el texto del diseño. La consulta no guarda nada. Para: empleados y administradores.

## 2. Alcance

**Entra**
- Botón "Validar en Renaper" junto al campo DNI, con su estado de carga.
- Consulta `GET /api/clientes/renaper/{dni}` (PR #50) con el DNI del formulario.
- Precarga de nombre, apellido, CUIL, fecha de nacimiento, sexo y domicilio con marca "Dato de Renaper".
- Rail derecho "Validación Renaper": badge, estado, fecha de validación (sin guardar) y nota.
- Caja de error del rail y error en el campo DNI para 404 `PERSONA_NO_ENCONTRADA`.
- Aviso para Renaper caído (502 o error de red).
- Bloqueo de "Guardar cliente" cuando Renaper dice que está fallecido.

**NO entra**
- Formulario, validaciones, `POST /api/clientes` y aviso al guardar: **US-FE-B-05**.
- Reintento de validación de un cliente ya guardado (`POST /api/clientes/{id}/validar-renaper`): **US-FE-B-08** (ver sección 13, D-B06-1).
- Request y tipos de Renaper y su mock: **US-FE-T-25**.
- Primitivos `Button`, `Badge`, `CardWidget`, `AlertaError`: T-05 y T-07.
- Consulta de DNRPA y vista previa de vehículos: fuera de alcance (PB-23).

## 3. Dependencias

- **Oleada:** 6.
- **Depende de:** US-FE-B-05, US-FE-T-07, US-FE-T-11, US-FE-T-19, US-FE-T-25.
- **Puede empezar sin esperar a:** US-FE-B-08 (ficha y reintento; no comparten código).
- **Bloqueada por pedidos al back:** ninguna. Renaper caído: 201 con aviso (D-16).

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB4 (fechas y DNI), FB7.7, FB7.11.
- `docs/frontend/pantallas/B4-nuevo-cliente.md`: §3 (fila 1 del formulario y rail derecho: medidas), §4 (`AccionRenaper`, `WidgetValidacionRenaper`), §5 (textos del rail y de la caja de error), §6 (DNI), §7 (filas de Renaper: encontrada, fallecida, no existe, caído), §8 ("Validar en Renaper"), §9 (`GET /api/clientes/renaper/{dni}` y mapeo de datos), §11 (responsive del rail), §12 (aria de resultados), §13 (D-2, D-3, D-4, D-5, D-9, D-14, D-17).
- `docs/frontend/contratos-api/seguridad-clientes-publico.md`: §3.3 (`PersonaRenaperResponse`, `DomicilioRenaperResponse`, 400, 404 con `codigo`, 502, nota de la URL con DNI), §3.1.1 (qué pasa en POST, para entender la diferencia con el GET).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §3.2 (códigos de 404 con `codigo`).
- `docs/frontend/design-system.md`: §5.13 (Card/Widget), §5.4 (Badge: Validado con tokens Vigente; Pendiente con tokens Pendiente), §5.1 (Button Secondary M con icono), §8.2 (estado error).
- `docs/frontend/tareas/INDEX.md`: FC2 (keys), FC10 (errores), FC11 (sin reintento automático), FC13 (cliente único), FC16.

## 5. Archivos a crear o modificar

Bajo `frontend/apps/backoffice/src/features/clientes/` (dueño B-06 para los nuevos; el resto es de B-04 y B-05):

| Archivo | Notas |
|---|---|
| `api/usePrevisualizarRenaper.ts` | `useQuery` con `enabled: false`; `retry` de 1 reintento solo ante 502 (D-25-2, RV-D23); `refetch()` al hacer clic. Key de T-25. |
| `components/AccionRenaper.tsx` | Botón "Validar en Renaper" con estado de carga. |
| `components/WidgetValidacionRenaper.tsx` | Rail: `CardWidget`, badge, estado, fecha y nota. |
| `components/CajaErrorRenaper.tsx` | Caja del rail para el error de DNI no encontrado. |
| `schemas/datosRenaperAFormulario.ts` | Convierte `PersonaRenaperResponse` en valores del formulario y en la lista de campos marcados. |
| `pages/AltaClientePage.tsx` | **Modificación** (dueño B-05): agrega el rail y el bloqueo de guardar. |
| `components/FormularioAltaCliente.tsx` y `SeccionDatosPersonales.tsx` | **Modificación** (dueño B-05): agrega el botón junto al DNI y la marca "Dato de Renaper" en los campos. |
| Tests | `api/usePrevisualizarRenaper.test.ts`, `components/WidgetValidacionRenaper.test.tsx`, `pages/AltaClientePage.test.tsx` (sección de Renaper). |

Compartidos (no editar): `packages/api/**` (T-25), `packages/ui/**` (T-05, T-07), `app/**` (T-16).

## 6. Pasos de implementación

1. Confirmar que B-05, T-07, T-11, T-19 y T-25 están mergeadas. Esta tarea va después de B-05 (mismos archivos del alta). Leer `PersonaRenaperResponse` y la key de la consulta (los nombres de §7 son sugeridos).
2. Crear `usePrevisualizarRenaper`: `enabled: false`; reintenta una sola vez y solo ante 502 (D-25-2, RV-D23); ante 4xx y error de red no reintenta. La función `refetch` se llama desde `AccionRenaper`. No guarda nada en el formulario.
3. `AccionRenaper`: botón Secondary M con icono `identification-card`, label `Validar en Renaper`. Deshabilitado si el DNI no tiene 8 dígitos (sin puntos) o mientras corre. Con carga: `aria-busy`.
4. Al recibir 200: `datosRenaperAFormulario` precarga `nombre`, `apellido`, `cuil`, `fechaNacimiento`, `sexo` y `domicilio.{calle, numero, localidad, provincia, codigoPostal}`. Ignora `piso` y `depto` (D-B06-3). Marca esos campos.
5. Marca "Dato de Renaper": cada campo precargado muestra esa leyenda como `helper` mientras su valor sigue igual al de Renaper. Si el usuario lo cambia, la leyenda desaparece.
6. `WidgetValidacionRenaper`: título `Validación Renaper`, badge (`Validado` para `VIGENTE`), dato `Estado` con `Vigente` o `Fallecido`, dato `Fecha de validación` con `Sin guardar`, y la nota. Antes de validar, muestra el texto de estado inicial (§8).
7. 404 con `codigo === "PERSONA_NO_ENCONTRADA"`: el campo DNI queda con `aria-invalid` y `helper` del texto del diseño; `CajaErrorRenaper` muestra el mismo texto con `role="alert"`.
8. 502 o error de red: el rail muestra la alerta de §8. No se precarga nada. "Guardar cliente" queda habilitado.
9. `estado === "FALLECIDO"`: el rail muestra el badge de error y el texto de §8; "Guardar cliente" queda deshabilitado con ese mismo texto.
10. Si el DNI cambia después de una consulta, el rail vuelve al estado inicial y se quitan las marcas "Dato de Renaper". No se borran los valores cargados a mano.
11. Escribir los tests de §10 antes de los componentes; correr `lint`, `typecheck`, `test`, `build`.

## 7. Contrato con el back

| Método y ruta | Estado | Request | Response 200 | Errores |
|---|---|---|---|---|
| `GET /api/clientes/renaper/{dni}` | Implementado (PR #50 mergeado); MSW de T-25 | Path `dni` (8 dígitos) | `PersonaRenaperResponse` | 400 (`detail`); 404 con `codigo: "PERSONA_NO_ENCONTRADA"`; 401; 403; 502 |

```ts
// Tipos en @nexa/api (dueño US-FE-T-25). No redefinir.
export interface DomicilioRenaperResponse {
  calle: string;
  numero: string;
  piso: string | null;     // no se usa en el alta (D-B06-3)
  depto: string | null;    // no se usa en el alta (D-B06-3)
  localidad: string;
  provincia: string;
  codigoPostal: string;
}

export interface PersonaRenaperResponse {
  dni: string;
  cuil: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;          // "yyyy-MM-dd"
  sexo: 'M' | 'F' | 'X';
  domicilio: DomicilioRenaperResponse;
  estado: 'VIGENTE' | 'FALLECIDO';  // texto fijo del back
  fechaFallecimiento: string | null;
}
```

- El 400 de formato no ocurre porque el botón solo se habilita con 8 dígitos; si llega, el campo DNI muestra `El DNI debe tener 8 dígitos.`.
- Un fallecido **no** es error en el GET: llega 200 con `estado: "FALLECIDO"`. El error de RN02 aparece solo al guardar (B-05).
- El DNI viaja en la URL. Es dato personal: no loguearlo ni ponerlo en analytics (sección 14).
- Handler MSW: **No aplica** (T-25). Las pruebas de error usan `server.use`.
- PB-14 y PB-15 no afectan esta consulta: no usa `ProblemDetails` de validación de modelo y el 404 trae `codigo`.
- Renaper caído (502) es el caso degradado previsto (D-16 del INDEX): el alta sigue disponible.
- Workaround MSW (FB7.7): `handlers/clientes.ts` (T-25) responde a `GET renaper/{dni}`.
- Query key: `clientesKeys.renaper(dni)` de T-25 (sugerido). No se invalida nada: la consulta no altera el listado.

## 8. Contenido de UI

Textos literales de B4 §5 y §7. Los marcados como propuesta no están en el diseño.

| Zona | Texto |
|---|---|
| Botón | `Validar en Renaper` |
| Título del rail | `Validación Renaper` |
| Rail: label dato 1 | `Estado` |
| Rail: valor dato 1 | `Vigente` (VIGENTE) · `Fallecido` (FALLECIDO, propuesta) |
| Rail: label dato 2 | `Fecha de validación` |
| Rail: valor dato 2 (D-B06-2) | `Sin guardar` (propuesta; el diseño muestra una fecha que no existe antes de guardar) |
| Rail: badge | `Validado` (VIGENTE) · sin badge antes de validar |
| Rail: nota | `Los datos de Renaper reemplazan los cargados a mano.` |
| Rail: estado inicial (propuesta, B4 D-14) | `Validá el DNI para ver los datos de Renaper.` |
| Caja de error y error del campo DNI (diseño) | `El DNI no existe en Renaper. Revisá el número e intentá de nuevo.` |
| Renaper caído (propuesta, B4 §7) | `Renaper no responde. Podés guardar el cliente y validarlo después.` |
| Fallecido, bloquea guardar (propuesta, copy del back sin prefijo) | `La persona figura como fallecida en Renaper.` |
| Leyenda en campo precargado (propuesta) | `Dato de Renaper` |
| Error de DNI de formato (back) | `El DNI debe tener 8 dígitos.` |

**No renderizar:** la anotación `Ejemplo de error` del diseño; la fecha `28/10/2026 10:41` (D-B06-2); los valores de muestra del diseño.

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Inicial | Botón habilitado solo con 8 dígitos; rail con estado inicial. |
| Consulta en curso | Botón deshabilitado con `aria-busy`; el resto del formulario sigue editable. |
| 200 VIGENTE | Badge `Validado`; precarga con marca; fecha `Sin guardar`. |
| 200 FALLECIDO | Badge de error y texto; "Guardar cliente" deshabilitado. |
| 404 PERSONA_NO_ENCONTRADA | Error en el campo DNI y caja del rail. "Guardar cliente" sigue habilitado (ver D-B06-4). |
| 404 sin `codigo` | Alerta genérica del rail (propuesta); no marca el campo. |
| 502 o error de red | Alerta de Renaper caído; sin precarga; "Guardar cliente" habilitado. |
| 401 | Lo maneja T-08. |
| Cambio de DNI después de validar | Rail vuelve a inicial; se quitan las marcas. |
| Campo editado por el usuario tras precargar | Se quita la leyenda "Dato de Renaper" de ese campo. |
| Foco tras error de consulta | Al campo DNI. |
| Foco en el botón tras consulta OK | Vuelve al botón. |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, MSW (`server.use` por caso).

| Test | Qué afirma |
|---|---|
| `el botón Validar en Renaper está deshabilitado con 7 dígitos y habilitado con 8` | Regla de habilitación. |
| `DNI con puntos llama a la consulta con 8 dígitos` | Normalización de la URL. |
| `la consulta no se hace sola al escribir el DNI` | Sin request antes del clic. |
| `la consulta ante 502 reintenta una sola vez y luego muestra la alerta de Renaper caído` | Dos requests como máximo. |
| `la consulta ante 4xx o error de red no reintenta` | Un solo request. |
| `200 VIGENTE muestra badge Validado y Estado Vigente` | Rail. |
| `200 VIGENTE precarga nombre, apellido, cuil, fecha, sexo y domicilio` | Mapeo. |
| `los campos precargados muestran "Dato de Renaper" y la leyenda desaparece al editarlos` | Marca. |
| `la fecha de validación muestra "Sin guardar"` | D-B06-2. |
| `piso y depto de Renaper no aparecen en el formulario` | D-B06-3. |
| `200 FALLECIDO muestra Fallecido y deshabilita Guardar cliente` | Bloqueo y texto. |
| `404 con codigo PERSONA_NO_ENCONTRADA marca el DNI y muestra la caja del rail` | Texto del diseño en dos lugares. |
| `404 sin codigo no marca el campo DNI` | Mapeo por `codigo`. |
| `502 muestra la alerta de Renaper caído y no precarga` | Estado degradado. |
| `error de red muestra la misma alerta que 502` | `HttpResponse.error()`. |
| `cambiar el DNI resetea el rail y las marcas` | Caso borde. |
| `durante la consulta el botón está deshabilitado con aria-busy` | Carga. |
| `el texto de estado inicial aparece antes de validar` | Propuesta de B4 D-14. |
| `no tiene violaciones de accesibilidad con el rail visible` | Helper de US-FE-T-19 (axe). |

## 11. Criterios de aceptación

1. "Validar en Renaper" está deshabilitado hasta que el DNI tenga 8 dígitos; durante la consulta, también.
2. La consulta es `GET /api/clientes/renaper/{dni}` con 8 dígitos y se dispara solo con el clic.
3. Una respuesta VIGENTE muestra el badge `Validado` y `Estado: Vigente` en el rail.
4. Una respuesta VIGENTE precarga nombre, apellido, CUIL, fecha de nacimiento, sexo y domicilio, y marca cada campo con "Dato de Renaper".
5. Editar un campo precargado quita su leyenda.
6. El rail muestra `Sin guardar` como fecha de validación; no se muestra una fecha antes de guardar.
7. `piso` y `depto` no se cargan en el formulario.
8. Una respuesta FALLECIDO muestra el estado en el rail y deshabilita "Guardar cliente" con el texto de §8.
9. 404 con `codigo: "PERSONA_NO_ENCONTRADA"` marca el campo DNI y muestra el texto del diseño en la caja del rail con `role="alert"`.
10. 404 sin `codigo` no marca el campo DNI.
11. 502 y error de red muestran el aviso de Renaper caído, no precargan y dejan "Guardar cliente" habilitado.
12. Cambiar el DNI devuelve el rail a su estado inicial y quita las marcas.
13. La consulta reintenta una sola vez ante 502 (D-25-2) y no reintenta ante 4xx ni error de red.
14. Los tests de §10 están en verde y el test de axe no tiene violaciones.
15. `npm run lint`, `typecheck`, `test` y `build` están en verde en `apps/backoffice`.

## 12. Verificación manual

Requiere el back con PR #50 o `VITE_USE_MOCKS=true` (T-25).

1. Abrir `/clientes/nuevo`. Escribir un DNI de 7 dígitos: el botón sigue deshabilitado.
2. Completar 8 dígitos y pulsar "Validar en Renaper" con un DNI vigente. Ver el badge, la precarga y las leyendas.
3. Editar un campo precargado. Ver que su leyenda desaparece.
4. Probar un DNI que no existe en Renaper. Ver el texto del diseño en el campo y en el rail.
5. Probar un DNI fallecido. Ver que "Guardar cliente" queda deshabilitado.
6. Simular Renaper caído (mock de 502 o red cortada). Ver el aviso y que se puede guardar.
7. Confirmar con la persona responsable los pasos 2 a 5 antes del PR (workflow regla 7).

## 13. Decisiones tomadas

Decididas por Sebastián el 2026-11-07 (regla 12): aceptó todas las opciones por defecto, una a una, tras verlas en una tabla con sus alternativas.

- **D-B06-1. Reintento de validación (INDEX B-06 y B-08).** No hay reintento en el alta. El reintento lo hace B-08 desde la ficha (RV-38).
- **D-B06-2. Fecha de validación antes de guardar (B4 D-4).** `Sin guardar`.
- **D-B06-3. Piso y departamento (B4 D-17).** Se ignoran en el alta.
- **D-B06-4. 404 y "Guardar cliente" (B4 §7; RV-D23, excepción de FC10).** "Guardar cliente" sigue habilitado; el back decide con su 400 de "no figura en Renaper".
- **D-B06-5. Precarga sobre datos cargados a mano (B4 D-5).** La precarga reemplaza los diez campos de identidad y domicilio y los marca. RN02 dice que Renaper pisa al guardar de todos modos.
- **D-B06-6. Texto del estado inicial (B4 D-14).** El de §8.
- **D-B06-7. Texto de Renaper caído (B4 §7).** El de §8.
- **D-B06-8. Caja de error o campo (B4 D-3).** Los dos, con el mismo texto del diseño.
- **D-B06-9. Aviso después de guardar.** No lo implementa esta tarea. Lo produce B-05 en el 201 y lo muestra B-04.

## 14. Riesgos y errores comunes

- **Reintentar la consulta de más:** consume cupo de Renaper y empeora la caída. Solo 1 reintento ante 502 (D-25-2); sin re-fetch al cambiar el DNI.
- **Confundir GET y POST:** en el GET, "no figura" es 404 con `codigo`; en el POST es 400 sin código. El front usa el GET para el rail y el POST para el resultado final (B-05).
- **Mostrar fallecido como error de red:** el GET responde 200 con `estado: "FALLECIDO"`.
- **Pisar lo que el usuario escribió sin marcarlo:** la precarga debe dejar visible de qué fuente sale cada valor.
- **Stale state:** cambiar el DNI sin resetear el rail y las marcas muestra datos de otra persona.
- **DNI en logs y analytics:** va en la URL. No loguearlo ni enviarlo a herramientas de telemetría.
- **Enum de sexo:** llega como `"M"`, `"F"` o `"X"`, no como número. Cargarlo tal cual en el `Select`.

## 15. Definición de terminado

- `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde en `apps/backoffice`.
- Sin secretos ni credenciales en el código.
- Accesibilidad revisada con el helper de US-FE-T-19 en `/clientes/nuevo` con el rail visible.
- Sin datos de Renaper en logs ni en código; sin `any`.
- Criterios de §11 tildados con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-38): el reintento `POST .../validar-renaper` sale de B-06 y queda en B-08; el INDEX de B-06 ya no lo lista.
- Resuelto (RV-38): el timeout de cliente y el reintento ante 502 los define T-25 (D-25-2).
- Resuelto (triage final, default de la ficha): merge después de B-05, porque esta tarea modifica `AltaClientePage.tsx` y `FormularioAltaCliente.tsx`. Motivo: no figura en REVISION.md ni en FB8; la dependencia ya está en el INDEX.
- Resuelto (triage final, default de la ficha): el helper de error del campo DNI en `Input` (T-04). Motivo: no figura en REVISION.md ni en FB8; design-system §5.2 ya lo prevé.
- Implementación: el rail y el bloqueo de guardar viven en `FormularioAltaCliente` (junto al `<form>`, en un `aside`), no en `AltaClientePage`: el rail necesita el DNI y el resultado de la consulta, que son estado del formulario. La página no cambió.
- Implementación: la consulta usa `gcTime: 0` y la clave lleva el DNI; cambiar el DNI descarta el resultado anterior y el rail vuelve al estado inicial sin efectos. Las marcas "Dato de Renaper" se derivan: un campo la conserva mientras su valor sea el de Renaper para el DNI consultado.
- Implementación: un 404 sin `codigo`, un 403 u otro error muestran la alerta de Renaper caído (no hay copy propio en el diseño). Un 400 de formato escribe `El DNI debe tener 8 dígitos.` en el DNI y en el rail.
- Implementación: el estado Fallecido usa el badge del token de error (`Cancelada`) con el texto `Fallecido`, porque el design system no define un badge propio.
- Interacción con B-05 (D-B05-8, número y código postal solo dígitos): si Renaper devuelve un número con letras o `S/N`, o un CPA, la precarga lo carga y el formulario lo marca como inválido al guardar. Una provincia que no está en la lista de 24 se precarga vacía.
