# US-FE-W-03: Consulta de póliza y tipos de navegación

Tipo W · Oleada 3 · Tamaño M · Rama sugerida `feature/US-FE-W-03-consulta-poliza` · Tarjeta Trello `US-FE-W-03`

## 1. Objetivo

Al terminar, `/consultar-poliza` (desktop y móvil) tiene el formulario de DNI y número de póliza. Al enviar, llama a `POST /api/publico/consulta` y, si responde 200, navega a `/poliza` con el resultado en `location.state`. Los errores 400 se muestran por campo; 404 y 429 muestran una alerta con el texto del Figma. Esta tarea también define y exporta los tipos de `location.state` que consumen W-04, W-05, W-06 y W-07. Para el cliente anónimo que quiere ver su póliza.

## 2. Alcance

**Entra**
- Feature `polizas` de la web (`apps/web-publica/src/features/polizas/`): `routes.tsx`, `index.ts`, `pages/ConsultarPolizaPage.tsx`, `components/FormularioConsultaPoliza.tsx`, `components/AlertaEstadoConsulta.tsx`, `api/useConsultarPoliza.ts`, `schemas/consulta.ts`, `schemas/navegacion.ts`, `types/navegacion.ts`.
- Tipos y guardas de `location.state` para W3 (`/poliza`), W4 y W5 (`/poliza/pagar/...`). Los exporta `index.ts`.
- Mapeo de errores de `POST /api/publico/consulta` a campos y a alertas.

**NO entra**
- La pantalla W3 (`/poliza`): US-FE-W-04 (desktop) y US-FE-W-05 (móvil).
- La pantalla W4 (`/poliza/pagar/medio-de-pago`): US-FE-W-06. Solo se navega hacia ella.
- Handler MSW de `POST /api/publico/consulta` y tipos de DTO: US-FE-T-31 (`packages/api`).
- `PublicNav`, `PublicFooter`, `PublicLayout`: US-FE-T-18.
- Medición de "demasiados intentos" con un contador: no hay `Retry-After` (PB-17, sección 13).

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-W-02 (sin relación de código).
- **Depende de:**
  - US-FE-T-04 (`Input` con label visible, `aria-invalid`, `aria-describedby`, foco 2 px).
  - US-FE-T-05 (`Button` Primary, size M, ancho completo).
  - US-FE-T-07 (`AlertaError` con `role="alert"`, para los casos que no son de tono aviso).
  - US-FE-T-11 (MSW base para los tests).
  - US-FE-T-17 (scaffold web pública) y US-FE-T-18 (`PublicLayout`, `PublicNav`, `PublicFooter`).
  - US-FE-T-19 (harness de accesibilidad).
  - US-FE-T-31 (función `consultarPolizaPublica` y tipos `ConsultaPublicaRequest` / `ConsultaPublicaResponse` en `@nexa/api`, handler MSW).
- **Bloqueada por pedidos al back:**
  - PB-17 (degrada): el 429 no trae `Retry-After`; se usa un texto fijo de 60 s (D-32).
  - PB-29 (mejora, no bloquea): validación de DNI y CUIL.
- **Workaround MSW:** no aplica; `POST /api/publico/consulta` está Implementado.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (features, `index.ts`), FB4 (contrato; errores), FB7.6 (mensajes en español de `detail`), FB7.5 (sin storage para datos del cliente).
- `docs/frontend/tareas/INDEX.md`: FC10 (errores: `detail` y `errors` por campo), FC11 (mutaciones: `retry: 0`, botón deshabilitado), FC12 (web: DNI en `location.state`, nada en storage), FC13 (no reintentar `/api/publico/*` ante 429), FC16 (accesibilidad de formularios), D-10, D-32.
- `docs/frontend/pantallas/W2-consultar-poliza.md`:
  - §1 (propósito, privacidad),
  - §2 (ruta `/consultar-poliza`, rate limit, salida a W3),
  - §3.1 (estructura desktop: card 560, alertas en columna 480),
  - §3.2 y §11 (390 px: todo apilado, alertas debajo del botón),
  - §4 (componentes: `Input`, `Button`, `FormularioConsultaPoliza`, `AlertaEstadoConsulta`),
  - §5 (textos literales),
  - §6 (campos, regex y mensajes),
  - §7 (estados: default, 404, 429, error de servidor),
  - §8 (acciones),
  - §9.1 a §9.3 (endpoint, campos de la respuesta, mapeo de errores),
  - §12 (accesibilidad),
  - §13 (dudas 1, 2, 4, 5, 9 y 11).
- `docs/frontend/pantallas/W3-mi-poliza.md` §2 y §9.1 (qué recibe W3 del estado de navegación).
- `docs/frontend/pedidos-al-back.md`: PB-07 (sin titular en la consulta), PB-17 (sin `Retry-After`), PB-29.
- `docs/frontend/contratos-api/seguridad-clientes-publico.md`:
  - §6.2 (request), §6.3 (response 200 y tipos TypeScript), §6.4 (estados),
  - §6.5 (errores 400, 404, 429, 500),
  - §1.4 (límite RN20: 10 requests por minuto).
- `docs/frontend/contratos-api/convenciones-transversales.md` §3.3 (clave de `errors` en PascalCase), §4 (rate limit, sin reintento).
- `docs/frontend/design-system.md`: §5.2 (Input: estados, label visible, helper), §5.1 (Button), §8.1 (contraste de `status/suspendida` en la alerta de aviso, 4,42: no cumple, registrar en T-19), §8.3 (foco).

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/web-publica/src/features/polizas/`:

| Archivo | Acción | Dueño |
|---|---|---|
| `routes.tsx` | crear: `/consultar-poliza` → `ConsultarPolizaPage`; `/poliza` queda como stub hasta W-04 | W-03 (primer task del feature `polizas` web) |
| `index.ts` | crear: exporta `polizasRoutes`, los tipos de navegación y `leerEstadoNavegacion` | W-03 |
| `pages/ConsultarPolizaPage.tsx` | crear | W-03 |
| `components/FormularioConsultaPoliza.tsx` | crear (presentación: dos `Input`, botón y fila de privacidad) | W-03 |
| `components/AlertaEstadoConsulta.tsx` | crear (tono `error` o `aviso`, icono decorativo y texto) | W-03 |
| `api/useConsultarPoliza.ts` | crear: `useMutation` sobre `consultarPolizaPublica` | W-03 |
| `schemas/consulta.ts` | crear: zod del formulario | W-03 |
| `schemas/navegacion.ts` | crear: zod de `EstadoMiPoliza` y `EstadoPagoPublico` | W-03 |
| `types/navegacion.ts` | crear: `EstadoMiPoliza`, `EstadoPagoPublico` (inferidos de los schemas) | W-03 |
| `pages/ConsultarPolizaPage.test.tsx` y `schemas/*.test.ts` | crear | W-03 |

Archivos compartidos que W-03 usa sin modificar: `packages/api/src/dto/publico.ts` y `packages/api/src/index.ts` (T-31, T-12), `packages/ui` (T-04, T-05, T-07), `apps/web-publica/src/app/*` (T-17, T-18). No editar `package.json` (FC17).

## 6. Pasos de implementación

1. **Schemas** (`schemas/consulta.ts`):
   - `dni`: `z.string().trim().regex(/^\d{8}$/, 'El DNI debe tener 8 dígitos.')`. Vacío: mensaje de la sección 8 (`Ingresá tu DNI.`).
   - `numeroPoliza`: `z.string().trim().toUpperCase().regex(/^POL-\d{7}$/, 'El número de póliza debe tener el formato POL-0000000.')`. Vacío: `Ingresá el número de póliza.`. La conversión a mayúsculas es DN-W3-3.
   - Tipo del formulario: `z.infer<typeof consultaSchema>`. El esquema es la fuente del tipo (FB1).
2. **Schemas de navegación** (`schemas/navegacion.ts`):
   - `EstadoMiPoliza = { dni: string; numeroPoliza: string; consulta: ConsultaPublicaResponse }`. `dni` 8 dígitos; `consulta` validado con el mínimo que W-04 necesita (`numeroPoliza`, `estado`, `vigenteDesde`, `vigenteHasta`, `plan`, `vehiculo`, `cuotas`).
   - `EstadoPagoPublico = EstadoMiPoliza & { cuotaIds: string[] }`, `cuotaIds` de 1 a 24, sin repetidos (límite de `PagoPublicoRequest.MaximoCuotas`). Lo consumen W-06 y W-07.
   - `leerEstadoNavegacion(state: unknown)`: devuelve el estado tipado o `null`. Nunca lanza.
3. **Mutación** (`api/useConsultarPoliza.ts`): `useMutation({ mutationFn: consultarPolizaPublica, retry: 0 })`. Sin `onMutate` ni reintento automático. El botón se deshabilita con `isPending`.
4. **Página** (`ConsultarPolizaPage.tsx`):
   - `h1` "Consultá tu póliza" (el único `h1` de la página).
   - Al enviar: validar con zod; si hay errores, poner foco en el primer campo inválido (FC16).
   - Si el request sale bien: `navigate('/poliza', { state: { dni, numeroPoliza, consulta } })`. `dni` y `numeroPoliza` ya normalizados.
   - Mapeo de errores (sección 9): 400 con `errors.Dni` o `errors.NumeroPoliza` → error en el campo correspondiente con el texto del back (ya en español); 404 → alerta "error" con el texto del Figma; 429 → alerta "aviso" con el texto del Figma; resto → alerta "error" con el texto genérico de la sección 8. Nunca mostrar `detail` del 404 (RN20; W2 §13.1).
5. **Presentación** (`FormularioConsultaPoliza.tsx`): card 560 px (desktop) con `Input` de DNI (`inputMode="numeric"`, `autoComplete="off"`, `maxLength={8}`) y de número de póliza; ayudas asociadas con `aria-describedby`; botón "Consultar" `type="submit"`; fila de privacidad con `icon/lock-key` decorativo. En 390 px, ancho completo y alertas debajo del botón.
6. **Alertas** (`AlertaEstadoConsulta.tsx`): tono `error` (fondo `status-cancelada-bg`, texto `status-cancelada-text`) o `aviso` (`status-suspendida-bg`, `status-suspendida-text`). `role="alert"`. Solo una alerta visible a la vez.
7. Desktop: las alertas van en una columna de 480 px a la derecha de la card. Móvil: debajo del botón.
8. Escribir tests (sección 10), ejecutar y verificar que ningún dato del cliente se escribe en storage.

## 7. Contrato con el back

**`POST /api/publico/consulta`** (`PublicoConsultaController`, anónimo, RN20)

- Estado: **Implementado** (`PublicoConsultaController.cs`).
- Request: `application/json`, DNI en el body (nunca en la URL).
- Response 200: `ConsultaPublicaResponse`.
- Errores: 400 (validación de DataAnnotations), 404 (mismo mensaje para DNI, póliza o cruce), 429 (rate limit, sin `Retry-After`), 500.

```ts
// packages/api/src/dto/publico.ts (dueño: US-FE-T-31). W-03 lo consume.
export interface ConsultaPublicaRequest {
  dni: string;          // ^\d{8}$
  numeroPoliza: string; // ^POL-\d{7}$
}
export type EstadoPoliza = 'PENDIENTE' | 'VIGENTE' | 'SUSPENDIDA' | 'CANCELADA' | 'VENCIDA';
export type EstadoCuota = 'PENDIENTE' | 'VENCIDA' | 'PAGADA' | 'ANULADA';
export interface ConsultaPublicaResponse {
  numeroPoliza: string;
  estado: EstadoPoliza;
  coberturaVigente: boolean;
  vigenteDesde: string; // "yyyy-MM-dd" (DateOnly, sin zona)
  vigenteHasta: string; // "yyyy-MM-dd"
  plan: { codigo: string; nombre: string };
  vehiculo: { patente: string; marca: string; modelo: string; anio: number };
  cuotas: CuotaPublica[]; // ordenadas por numero
}
export interface CuotaPublica {
  idCuota: string;    // uuid
  numero: number;
  importe: number;
  recargo: number;    // 0 hasta vencer
  total: number;      // importe + recargo
  vencimiento: string; // "yyyy-MM-dd"
  estado: EstadoCuota;
}
```

Ejemplo de request: `{ "dni": "30123456", "numeroPoliza": "POL-0000001" }`.

Errores de este endpoint (`seguridad-clientes-publico.md` §6.5):

| Status | Forma | Mensaje a mostrar |
|---|---|---|
| 400 | `ValidationProblemDetails` con `errors.Dni` o `errors.NumeroPoliza` | Texto del back (ver sección 8) en el campo |
| 404 | `ProblemDetails` sin `codigo` | Texto del Figma (alerta de error) |
| 429 | `ProblemDetails` con `detail` fijo | Texto del Figma (alerta de aviso) |
| 500 / red | `ProblemDetails` `detail` "Ocurrió un error inesperado." / sin respuesta | Texto genérico (sección 8) |

Handler MSW: lo escribe US-FE-T-31. En los tests de W-03, `server.use(...)` para forzar 400, 404, 429 y 500.

## 8. Contenido de UI

| Zona | Texto literal |
|---|---|
| Nav | Planes · Contacto · Consultar póliza (lo pone T-18) |
| Título (`h1`) | Consultá tu póliza |
| Bajada | Ingresá tu DNI y el número de póliza para ver su estado y pagar sus cuotas. |
| Label DNI | DNI |
| Ejemplo visible en el campo DNI (placeholder; no es el label) | 30123456 |
| Ayuda DNI | Sin puntos ni espacios. |
| Label número | Número de póliza |
| Ejemplo visible (placeholder) | POL-0000042 |
| Ayuda número | Los datos figuran en tu póliza. |
| Botón | Consultar |
| Botón durante el envío (propuesta) | Consultando… |
| Privacidad | Tus datos viajan cifrados y no se guardan en este dispositivo. |
| Error DNI vacío (propuesta, NO DEFINIDO) | Ingresá tu DNI. |
| Error DNI (back, literal) | El DNI debe tener 8 dígitos. |
| Error número vacío (propuesta, NO DEFINIDO) | Ingresá el número de póliza. |
| Error número (back, literal) | El número de póliza debe tener el formato POL-0000000. |
| Alerta 404 (literal del Figma, W2 §5) | No encontramos una póliza con esos datos. Revisá el DNI y el número de póliza. |
| Alerta 429 (literal del Figma, W2 §5) | Hiciste muchos intentos. Esperá un minuto y volvé a probar. |
| Alerta 500 / red (propuesta, NO DEFINIDO) | No pudimos consultar tu póliza. Intentá de nuevo en unos minutos. |

Las etiquetas "Estado: póliza no encontrada" y "Estado: demasiados intentos" del Figma **no se renderizan** (son anotaciones de diseño; DN-W3-2).

## 9. Estados y casos borde

| Estado | Comportamiento |
|---|---|
| Default | Card con campos vacíos, botón activo, sin alertas. |
| Campos inválidos (front) | No se llama a la API. Error en el campo con `aria-invalid="true"` y `aria-describedby` apuntando al mensaje; foco al primer campo inválido. |
| Enviando | Botón deshabilitado con el texto "Consultando…"; `aria-busy="true"` en el formulario. Los campos quedan editables (DN-W3-5). |
| 200 | Navega a `/poliza` con el estado (sección 6, paso 4). |
| 400 del back | Error en el campo. No se muestra alerta global. |
| 404 | Alerta "error" con el texto del Figma. El formulario conserva los valores. |
| 429 | Alerta "aviso" con el texto del Figma. No hay reintento automático ni contador (DN-W3-4). |
| 500 / red | Alerta "error" genérica. El usuario reenvía con el botón. |
| Nueva consulta | Una consulta nueva borra la alerta anterior. |
| `DNI` con puntos o espacios | El `trim` quita los espacios; los puntos dan 400 y se muestra el mensaje del back. El front no quita puntos (DN-W3-6). |

Seguridad y privacidad: el DNI viaja solo en el body y en `location.state`. No se escribe en la URL, en `localStorage`, `sessionStorage` ni cookies (FC12). Tests de regresión lo verifican.

## 10. Tests requeridos

Vitest + Testing Library + MSW. Un test por regla de validación y por cada error mapeado (FC5).

| Test (`ConsultarPolizaPage.test.tsx`, `schemas/consulta.test.ts`) | Afirma | Herramienta |
|---|---|---|
| `DNI con menos de 8 dígitos muestra el mensaje del back` | texto "El DNI debe tener 8 dígitos.", `aria-invalid="true"` | Testing Library |
| `DNI vacío muestra Ingresá tu DNI.` | texto de la sección 8 | Testing Library |
| `número sin formato muestra el mensaje del back` | texto "El número de póliza debe tener el formato POL-0000000." | Testing Library |
| `número en minúsculas se normaliza a mayúsculas` | "pol-0000042" se envía como "POL-0000042" (DN-W3-3) | zod + Testing Library |
| `ayudas asociadas con aria-describedby` | "Sin puntos ni espacios." asociada al DNI | Testing Library |
| `foco al primer campo inválido` | `document.activeElement` es el DNI | Testing Library |
| `envío válido llama a POST con el body` | MSW recibe `{ dni, numeroPoliza }` | MSW + Testing Library |
| `200 navega a /poliza con el estado` | `location.state` tiene `dni`, `numeroPoliza` y `consulta` | MemoryRouter |
| `404 muestra la alerta de error del Figma y no el detail` | texto literal de la sección 8; no aparece el `detail` del back | MSW + Testing Library |
| `429 muestra la alerta de aviso y no reintenta` | texto de 429; una sola petición tras la respuesta | MSW + spy |
| `400 con errors.Dni marca el campo DNI` | el texto del back aparece junto al campo | MSW + Testing Library |
| `500 muestra el mensaje genérico` | texto de la sección 8 | MSW |
| `botón deshabilitado mientras envía; doble clic envía una vez` | una sola petición con dos clics | MSW + userEvent |
| `no escribe el DNI en storage ni en la URL` | spies de `localStorage`/`sessionStorage` sin llamadas; `location.search` vacío | spies + MemoryRouter |
| `leerEstadoNavegacion devuelve null sin estado válido` | `null` con `undefined`, objeto incompleto y `cuotaIds` vacío | Vitest |
| `EstadoPagoPublico rechaza más de 24 cuotas` | el schema falla con 25 ids | Vitest |
| `no tiene violaciones de accesibilidad` | axe sobre el formulario con alerta visible | vitest-axe |

## 11. Criterios de aceptación

1. `/consultar-poliza` renderiza el formulario con los textos de la sección 8 y un único `h1`.
2. El DNI y el número se validan con los regex del back; los mensajes del back aparecen literales (tests).
3. Al enviar datos válidos, el body es `{ dni, numeroPoliza }` (test MSW).
4. Un 200 navega a `/poliza` con `location.state` que cumple `EstadoMiPoliza` (test).
5. Un 404 muestra la alerta del Figma y no el `detail` del back (test).
6. Un 429 muestra la alerta de aviso y no hay reintento automático (test).
7. Un 400 con `errors.Dni` o `errors.NumeroPoliza` marca el campo correspondiente (test).
8. El botón se deshabilita mientras envía y un doble clic produce una sola petición (test).
9. Ningún dato del cliente se escribe en `localStorage`, `sessionStorage`, cookies ni en la URL (tests).
10. `EstadoPagoPublico` acepta 1 a 24 `cuotaIds` sin repetidos y rechaza otros casos (tests).
11. En 390 px el formulario ocupa el ancho disponible y las alertas quedan debajo del botón (verificación manual).
12. Sin violaciones de axe (test).
13. `lint`, `typecheck`, `test` y `build` en verde (FC8).

## 12. Verificación manual

1. Abrir `/consultar-poliza`. Verificar el título, la bajada, los dos campos con su label visible y el texto de privacidad.
2. Enviar con el DNI vacío: aparece "Ingresá tu DNI." y el foco va al campo DNI.
3. Escribir `1234` en DNI y enviar: aparece "El DNI debe tener 8 dígitos.".
4. Escribir `pol-0000042` en el número: se envía en mayúsculas (DN-W3-3).
5. Con el backend local, consultar una póliza real de seed (DNI 30123456, POL-0000001): debe llegar a `/poliza`.
6. Consultar con un número que no existe: aparece la alerta de "no encontrada" del Figma.
7. Hacer diez consultas seguidas: aparece la alerta de "demasiados intentos" y el texto fijo.
8. Recargar `/poliza` directamente: W-04 redirige a `/consultar-poliza` (verificación cruzada).
9. DevTools en 390 px: el formulario ocupa el ancho y las alertas quedan debajo del botón; sin scroll horizontal.
10. Confirmar al equipo la regla del 404 antes de abrir el PR (DN-W3-1).

## 13. Decisiones pendientes con su default

| ID | Tema | Default | Fuente |
|---|---|---|---|
| DN-W3-1 | **[CONFIRMAR]** con diseño (RV-D01). Texto del 404 (Figma) frente al `detail` del back | Texto del Figma; no se muestra el `detail` (RN20). No cerrar sin confirmación del equipo: diseño | W2 §13.1; RV-D01 |
| DN-W3-2 | Etiquetas "Estado: ..." de las alertas | No se renderizan (anotación de diseño) | W2 §13.2 |
| DN-W3-3 | Mayúsculas en `POL-` | Se normaliza a mayúsculas antes de validar | W2 §13.11 |
| DN-W3-4 | Bloqueo por 429 | Sin contador y botón activo; el texto fijo dice "un minuto" (D-32). Pedir `Retry-After` a back (PB-17) | W2 §13.7; INDEX D-32 |
| DN-W3-5 | Campos durante el envío | Editables; solo el botón se deshabilita | W2 §13.6 |
| DN-W3-6 | Puntos o espacios en el DNI | Se rechazan con el mensaje del back; el front no los quita | W2 §6 |
| DN-W3-7 | Destino de "Consultar póliza" del nav en esta página | Sin acción distinta (la misma ruta); lo define T-18 | W2 §13.8 |
| DN-W3-8 | Acceso directo a `/poliza` sin estado | Redirige a `/consultar-poliza` (lo implementa W-04) | W2 §13.9 |

Texto de error de campo vacío (sección 8) y texto de error genérico: propuestas, NO DEFINIDAS en el Figma; validar con diseño antes del PR.

## 14. Riesgos y errores comunes

- **Mostrar el `detail` del 404:** es el mismo texto siempre, pero el Figma define otro. Mezclarlos rompe el diseño y revela formato (RN20).
- **Reintento automático:** la query por defecto de TanStack reintenta; usar `retry: 0` en la mutación. Un 429 reintentado empeora el bloqueo (FC13).
- **Guardar el DNI "para recordarlo":** prohibido (FB7.5, FC12). Los tests de storage deben quedar en verde.
- **`location.state` como fuente de verdad en W-04:** si el usuario recarga, el estado persiste en el historial del router; si la navegación entra sin estado, W-04 redirige. No volver a llamar a la API desde W-04.
- **Tipos duplicados:** `EstadoPagoPublico` se exporta desde `features/polizas/index.ts`; W-06 y W-07 lo importan de ahí, no de los archivos internos (FB3 regla 1).
- **Foco en el campo inválido:** con react-hook-form hay que llamar a `setFocus` del primer error; si no, el foco queda en el botón.

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `build` en verde para `apps/web-publica` (FC8).
- Accesibilidad revisada con US-FE-T-19: labels visibles, `aria-invalid`, `aria-describedby`, `role="alert"` en las alertas, foco al primer error, `h1` único.
- Sin secretos ni credenciales; ningún dato del cliente en storage ni en la URL (test).
- Los 13 criterios de la sección 11 tildados con evidencia observada (FC6).
- DN-W3-1 y DN-W3-4 comunicados a diseño y a back (PB-17) en el PR.

## 16. Observaciones al índice

- Resuelto (RV-D01): el INDEX ya dice "404 con el texto del Figma (RV-D01)" y "429 con espera fija de 60 s (PB-17)"; esta ficha usa el texto del Figma para el 404 (DN-W3-1, **[CONFIRMAR]** con diseño).
- Resuelto (RV-45): el INDEX dice "tipos de `location.state` para W3 a W5"; W6 (W-08) no recibe estado porque es el retorno de la pasarela.
- Resuelto (RV-45): W3 §8 debe incluir `consulta`, porque W-04 §9.1 lo necesita; el estado de esta tarea ya lo transporta hacia W-04, W-06 y W-07 (`EstadoPagoPublico`).
