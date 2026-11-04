# US-FE-W-08: Pago aprobado (retorno de la pasarela)

Tipo W · Oleada 6 · Tamaño M · Rama sugerida `feature/US-FE-W-08-pago-aprobado` · Tarjeta Trello `US-FE-W-08`

**ESTADO: DB-W8-1 aplicada por FB8 con la opción (A) (RV-D17).** Empieza después de W-06. Queda **[CONFIRMAR]** seguridad: no cerrar la tarea sin confirmación del equipo, antes de W-06.

## 1. Objetivo

Al terminar, `/pago/exito` (URL de retorno de la pasarela, `Pagos:UrlRetornoExito`) muestra el estado real del pago que dejó W-06: "Pago aprobado" con su número de operación y la nota de factura, "verificando" si la pasarela todavía no confirmó, o un mensaje de no identificado si no hay pago que mostrar. El estado sale de `POST /api/publico/pagos/estado` (no existe: PB-01, se mockea) y la factura de `POST /api/publico/factura` (Implementado). Para el cliente anónimo que vuelve de la pasarela.

## 2. Alcance

**Entra**
- Ruta `/pago/exito` en la feature `pagos` de la web (`routes.tsx` de W-06, con una ruta más).
- Página `PagoAprobadoPage` con los cuatro estados: sin pago identificado, verificando, aprobado (con nota de factura) y rechazado (propuesta).
- Lectura de `numeroPago` con `leerNumeroPagoEnCurso()` (W-06).
- Consultas `POST /api/publico/pagos/estado` (mock) y `POST /api/publico/factura`.
- Componente `DetallePago` (`<dl>`) y `NotaFacturaEnProceso`.

**NO entra**
- Descarga del comprobante y PDF de factura: no hay endpoint (PB-11, D-06).
- Reintento de factura (D-12, oculto).
- Consultas de cuotas de la póliza en esta pantalla: requieren `dni` y `numeroPoliza`, que el front no conserva (DB-W8-1).
- Webhook de la pasarela: lo consume el back.
- Implementar `POST /api/publico/pagos/estado` en el back: es PB-01.

## 3. Dependencias

- **Puede empezar sin esperar a:** nada (`—` en el INDEX). Empieza después de W-06, de la que depende.
- **Decisión DB-W8-1 aplicada por FB8 (RV-D17): opción (A).** Cómo obtiene W6 el `dni` y el `numeroPoliza` al volver de la pasarela; FC12 no cambia.
  - FC12 (`INDEX.md`) y W4 D15 solo permiten guardar `numeroPago`, y se mantienen.
  - `POST /api/publico/factura` (contrato vigente: `dni` y `numeroPago`, `PublicoFacturaRequest`) y `POST /api/publico/pagos/estado` (PB-01) piden hoy el DNI: el back debe aceptar `numeroPago` sin DNI.
  - `POST /api/publico/consulta` exige `dni` y `numeroPoliza` y es lo único que devuelve las cuotas pagadas: esta pantalla no lo usa (sin DNI en storage ni en la URL).
  - Opciones descartadas: **(B)** guardar `dni` y `numeroPoliza` en `sessionStorage` (rompe FC12 y W4 D15); **(C)** pedir el DNI otra vez en W6 (no hay diseño para ese formulario).
- **Depende de** (fila del INDEX):
  - US-FE-T-05 (`Badge/Estado`, `Button`).
  - US-FE-T-07 (`AlertaError`, `CardWidget`).
  - US-FE-T-09 (`formatearFechaHora` en `America/Argentina/Buenos_Aires`, `formatearImporte`).
  - US-FE-T-11 (MSW base).
  - US-FE-T-18 (`PublicLayout`, `PublicNav`, `PublicFooter`).
  - US-FE-T-19 (harness de accesibilidad).
  - US-FE-T-31 (`consultarEstadoPagoPublico`, `consultarFacturaPublica`, sus tipos y handlers MSW).
  - US-FE-W-06 (`leerNumeroPagoEnCurso`, la ruta de W4 y la pantalla de origen; `features/pagos/index.ts`).
- **Bloqueada por pedidos al back:**
  - PB-01 (MSW, bloquea): sin endpoint de estado público; se mockea con el contrato propuesto.
  - PB-11 (degrada): sin PDF; sin botón de descarga.
  - PB-16 (degrada): `DateTime` sin `Z` según el endpoint; se trata como UTC (FB4).
  - PB-22 (degrada): sin nombre comercial de la pasarela; no se muestra "con Pasarela A".
- **Workaround MSW:** handlers de `POST /api/publico/pagos/estado` (PB-01) y de `POST /api/publico/factura` (Implementado) en T-31.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB4 (fechas: `DateTime` sin `Z` se trata como UTC y se muestra en Buenos Aires), FB7.4 (zona horaria), FB7.7 (MSW).
- `docs/frontend/tareas/INDEX.md`: FC9 (fechas), FC10 (errores), FC12 (storage: solo `numeroPago`), FC13 (no reintentar `/api/publico/*` ante 429), FC16 (anuncio con `role="status"`, foco al `h1`), D-12, D-22, D-06.
- `docs/frontend/pantallas/W6-pago-aprobado.md`:
  - §1 (propósito; qué NO hace),
  - §2 (ruta `/pago/exito`; sin estado de navegación; guardas),
  - §3 (estructura: tarjeta de 640 px, círculo de 72 px, título, subtítulo, detalle, nota, acciones, pie),
  - §4 (componentes; el badge "Pagada" es `Badge/Estado`; la nota es un frame propio),
  - §5 (textos literales; sección "Textos NO definidos"),
  - §6 (datos que necesita el front; sin ellos no mostrar "Pago aprobado"),
  - §7 (estados: aprobado, verificando, rechazado, no identificado, factura en proceso o autorizada),
  - §8 (acciones),
  - §9.1 (estado de cuotas), §9.2 (factura), §9.3 (total, número, fecha), §9.4 (retorno),
  - §10 (RN11, RN08, RN20),
  - §11 (390 px),
  - §12 (accesibilidad: `role="status"`, `<dl>`, foco al `h1`),
  - §13 (D1 a D12; bloqueantes D1, D2, D3).
- `docs/frontend/pedidos-al-back.md`: PB-01 (contrato propuesto `ConsultaEstadoPagoRequest` y `EstadoPagoPublicoResponse`, workaround), PB-11, PB-16, PB-22.
- `docs/frontend/contratos-api/pagos-facturas.md`:
  - §3 (`PublicoFacturaRequest`, `FacturaResponse`, `EstadoFactura`, `EstadoPago`),
  - §5 paso 6 (cómo se entera el front: el 404 de factura no distingue pendiente de rechazado),
  - §7.1 (estados de factura), §7.2 (campos a mostrar), §7.3 (sin descarga),
  - §10.5 (`POST /api/publico/factura`).
- `docs/frontend/contratos-api/convenciones-transversales.md` §5.3 (`DateTime` en UTC), §5.4 (importes).
- `docs/frontend/design-system.md`: §5.4 (`Badge/Estado`, "Pagada" usa tokens de Vigente), §8.1 (contraste de la nota: verificar).

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/web-publica/src/features/pagos/`:

| Archivo | Acción | Dueño |
|---|---|---|
| `routes.tsx` | modificar: agregar `/pago/exito` → `PagoAprobadoPage` | W-06 (dueño); W-08 edita en su PR y lo declara (FC1) |
| `index.ts` | modificar: exportar solo lo necesario (sin cambios de API pública salvo que W-08 lo requiera) | W-06 |
| `pages/PagoAprobadoPage.tsx` | crear | W-08 |
| `components/DetallePago.tsx` | crear (`<dl>` con total, número, fecha y cuotas) | W-08 |
| `components/NotaFacturaEnProceso.tsx` | crear | W-08 |
| `api/usePagoEnCurso.ts` | crear: `useQuery` de `pagos/estado` (sin reintentos) | W-08 |
| `api/useFacturaPublica.ts` | crear: `useQuery` de `factura` (sin reintentos) | W-08 |
| `pages/PagoAprobadoPage.test.tsx` y `components/*.test.tsx` | crear | W-08 |

Usa sin modificar: `api/almacenamientoPago.ts` (W-06), `packages/api` (T-31, T-09), `packages/ui` (T-05, T-07), `apps/web-publica/src/app/*` (T-17, T-18). No editar `package.json` (FC17).

## 6. Pasos de implementación

1. **Decisión**: registrar en el PR la opción (A) de DB-W8-1 (RV-D17). FC12 no cambia. La **[CONFIRMAR]** de seguridad la confirma el equipo antes de W-06; si la rechaza, detener esta tarea y reabrir RV-D17.
2. **Lectura del pago**: `leerNumeroPagoEnCurso()`. Si devuelve `null`, mostrar el estado "no identificado" (sección 9) y **no** hacer ninguna petición.
3. **Estado** (`usePagoEnCurso`): `useQuery({ queryKey: pagosPublicosKeys.estado(numeroPago), queryFn: consultarEstadoPagoPublico, retry: false, enabled: numeroPago !== null })`.
   - Body (opción A, default): `{ numeroPago }`. Opción sin decidir: `{ dni, numeroPago }` (PB-01).
   - **No** hay polling automático (RN20: 10 por minuto por IP). "Volver a consultar" hace `refetch()` por clic.
4. **Factura** (`useFacturaPublica`): solo si `estado === 'APROBADO'`. `enabled` según el estado del pago. Body de `PublicoFacturaRequest` (`{ dni, numeroPago }`; con opción A, `numeroPago` solo, lo que requiere el cambio del back). `retry: false`. Un 404 significa "sin factura todavía": no es error.
5. **Presentación** (`PagoAprobadoPage.tsx`):
   - Estado `APROBADO`: `h1` "Pago aprobado" con foco al montar; `role="status"` en el bloque de resultado; círculo de 72 px con `icon/check-circle` de 40 px decorativo; subtítulo (sección 8, según los datos que haya); `DetallePago`; `NotaFacturaEnProceso` si `factura.estado === 'PENDIENTE_CAE'`; botón "Volver a mi póliza" (ver DN-W8-4).
   - Estado `PENDIENTE`: mismo layout con círculo en gris (`surface-subtle`), título "Verificando el pago" y botón "Volver a consultar". Texto propuesto, NO DEFINIDO en el Figma.
   - Estado `RECHAZADO`: título y texto propuestos (sección 8), botón a `/consultar-poliza`.
   - Sin `numeroPago`: título "No pudimos identificar tu pago" (propuesta) y enlace a `/consultar-poliza`.
6. **`DetallePago`** (`<dl>`): filas "Total pagado" (solo si el back lo expone; por defecto **no** se muestra, DN-W8-2), "Número de operación" (`numeroPago`, en Mono), "Fecha" (`formatearFechaHora(fechaAcreditacion)` en Buenos Aires; fila omitida si es `null`), "Cuotas" (solo si el back las expone; DN-W8-3).
7. **Nota de factura** (`NotaFacturaEnProceso`): fondo `accent-promo`, radio 16 px, padding 16 px, `icon/clock` 20 px decorativo y texto (sección 8). Se oculta si la factura está `AUTORIZADA`, si devuelve 404 o si no hay factura (DN-W8-5).
8. **Acciones**: "Volver a mi póliza" (Primary, M) lleva a `/consultar-poliza` (DN-W8-4). No hay "Descargar comprobante" (D-06, PB-11).
9. Escribir los tests de la sección 10 y ejecutarlos.

## 7. Contrato con el back

**`POST /api/publico/pagos/estado`** (PB-01)

- Estado: **NO EXISTE**. Se mockea con MSW (`VITE_USE_MOCKS`) hasta que el back lo publique.
- Request (opción A de DB-W8-1, RV-D17): `{ numeroPago: string }`. El contrato propuesto en PB-01 incluye `dni`; la desviación se marca en el PR y en el handler MSW.
- Response 200 (propuesta): `EstadoPagoPublicoResponse`.
- Errores: 404 genérico si DNI o número no corresponden (RN20), 429 por RN20, 500.

```ts
// packages/api/src/dto/publico.ts (dueño: US-FE-T-31). Contrato propuesto (PB-01).
export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export interface ConsultaEstadoPagoRequest {
  dni: string;        // ^\d{8}$ (opción A: se quita)
  numeroPago: string; // PAG-xxxxxx
}
export interface EstadoPagoPublicoResponse {
  numeroPago: string;
  estado: EstadoPago;
  fechaAcreditacion: string | null; // ISO UTC con Z
  urlPago: string | null;           // solo si PENDIENTE y no expiró
  factura: FacturaResponse | null;
}
```

**`POST /api/publico/factura`** (`PublicoPagosController`, anónimo, RN20)

- Estado: **Implementado** (US-F4-03).
- Request vigente: `PublicoFacturaRequest { dni: string; numeroPago: string }`. Con la opción A (RV-D17) el back acepta `{ numeroPago }` sin DNI; hasta entonces MSW con ese body y desviación marcada en el PR.
- Response 200: `FacturaResponse`.
- Errores: 400 por validación, 404 genérico (DNI incorrecto, número ajeno, o pago sin factura: no se distingue), 429.

```ts
// packages/api/src/dto/pagos.ts y publico.ts (dueño: US-FE-T-29 y T-31)
export type EstadoFactura = 'PENDIENTE_CAE' | 'AUTORIZADA';
export interface FacturaResponse {
  id: string;
  pagoId: string;
  numero: string;               // "" mientras PENDIENTE_CAE
  tipo: 'B';
  importe: number;
  estado: EstadoFactura;
  cae: string | null;           // 14 dígitos
  vencimientoCae: string | null; // "yyyy-MM-dd"
  fechaEmision: string;          // ISO UTC con Z
}
```

Ejemplo de factura en proceso: `{ "id": "…", "pagoId": "…", "numero": "", "tipo": "B", "importe": 51250.0, "estado": "PENDIENTE_CAE", "cae": null, "vencimientoCae": null, "fechaEmision": "2026-10-28T17:32:00Z" }`.

Handlers MSW: US-FE-T-31. En los tests, `server.use(...)` para APROBADO, PENDIENTE, RECHAZADO, factura en proceso, factura autorizada y 404.

Datos que **no** están en ningún contrato y **no** se muestran: total pagado (no hay endpoint público con el importe; W6 §9.3), cuotas pagadas (requieren consulta con DNI), nombre de la pasarela (PB-22), PDF (PB-11).

## 8. Contenido de UI

| Zona | Texto literal |
|---|---|
| Nav | Planes · Contacto · Consultar póliza (T-18) |
| `h1` aprobado | Pago aprobado |
| Subtítulo aprobado, sin datos de cuotas (default, DN-W8-3) | Tu pago está registrado. |
| Subtítulo con cuotas (si el back las expone; W6 §5) | Pagaste las cuotas 8 y 9 de la póliza POL-0000042. |
| Detalle, etiqueta | Número de operación |
| Detalle, valor | PAG-6f1c2a (formato del back; no PA-7741-2093, DN-W8-1) |
| Detalle, etiqueta | Fecha |
| Detalle, valor | 28/10/2026 14:32 (hora de Buenos Aires) |
| Nota de factura (factura en proceso) | La factura está en proceso (Pendiente de CAE). |
| Nota, segunda frase (DN-W8-6, sin confirmar) | Te la enviamos por email apenas ARCA la autorice. |
| Botón | Volver a mi póliza (DN-W8-4: lleva a W2) |
| Verificando (propuesta, NO DEFINIDO) | Verificando el pago |
| Verificando, texto (propuesta) | Todavía no recibimos la confirmación de la pasarela. Podés volver a consultar en unos minutos. |
| Verificando, botón (propuesta) | Volver a consultar |
| Rechazado (propuesta, NO DEFINIDO) | El pago no se pudo confirmar. |
| Rechazado, botón (propuesta) | Consultar póliza |
| Sin número (propuesta, NO DEFINIDO) | No pudimos identificar tu pago. |
| Sin número, botón (propuesta) | Consultar póliza |
| Error 429 (literal de W2) | Hiciste muchos intentos. Esperá un minuto y volvé a probar. |
| Error de red o 500 (propuesta) | No pudimos consultar el estado del pago. Intentá de nuevo en unos minutos. |
| Pie | Teléfono · A confirmar · Email · A confirmar · Ubicación · Dirección a confirmar · Horarios · Lunes a viernes, horario a confirmar · © 2026 Nexa Seguros. Todos los derechos reservados. (T-18) |

Formatos: importes con `formatearImporte`; fecha y hora con `formatearFechaHora` (zona `America/Argentina/Buenos_Aires`, `DateTime` sin `Z` tratado como UTC; FB4).

## 9. Estados y casos borde

| Estado | Comportamiento |
|---|---|
| Sin `numeroPago` en `sessionStorage` (o `sessionStorage` no disponible) | "No pudimos identificar tu pago." y enlace a W2. Sin peticiones. |
| Cargando estado | Esqueleto de la tarjeta de 640 px. |
| `PENDIENTE` | "Verificando el pago". "Volver a consultar" hace `refetch()` por clic. Sin polling. |
| `APROBADO` | Pantalla de éxito con detalle; factura se pide en paralelo. |
| `RECHAZADO` | Mensaje propuesto con enlace a W2. Sin reintento de pago desde aquí. |
| Factura `PENDIENTE_CAE` | Nota visible. |
| Factura `AUTORIZADA` | Nota oculta (DN-W8-5); el CAE y su vencimiento no se muestran (sin diseño). |
| Factura 404 | Nota oculta; no es error. |
| Estado 404 | Mismo mensaje de "No pudimos identificar tu pago." |
| Estado 429 | Texto fijo de 429. Sin reintento automático (FC13). |
| Red o 500 | Texto genérico y "Volver a consultar" manual. |
| Recarga de la página | `numeroPago` sigue en `sessionStorage` de la pestaña; la pantalla se reconstruye sin volver a pagar. |
| Retorno en otra pestaña | `sessionStorage` no se comparte: "No pudimos identificar tu pago." (esperado; W6 §13 D3). |

Accesibilidad: `role="status"` anuncia el resultado; foco al `h1`; `<dl>` para el detalle.

## 10. Tests requeridos

Vitest + Testing Library + MSW. Un test por estado y por regla (FC5).

| Test | Afirma | Herramienta |
|---|---|---|
| `sin numeroPago muestra no identificado y no hace peticiones` | texto propuesto y ninguna petición | MSW + spy |
| `con numeroPago APROBADO muestra Pago aprobado` | `h1` con el texto y `role="status"` | MSW |
| `el foco va al h1 al montar` | `document.activeElement` es el `h1` | Testing Library |
| `muestra el número de operación del back` | "PAG-6f1c2a" en `<dd>` | Testing Library |
| `fecha con hora de Buenos Aires` | `fechaAcreditacion` "2026-10-28T17:32:00Z" → "28/10/2026 14:32" | Testing Library |
| `sin fechaAcreditacion no muestra la fila de fecha` | no aparece "Fecha" | Testing Library |
| `PENDIENTE muestra verificando y no hace polling` | texto propuesto y una sola petición tras 5 s | MSW + fake timers |
| `RECHAZADO muestra el mensaje propuesto` | texto y botón a W2 | MSW |
| `factura PENDIENTE_CAE muestra la nota literal` | "La factura está en proceso (Pendiente de CAE)." | MSW |
| `factura AUTORIZADA oculta la nota` | no aparece la nota | MSW |
| `factura 404 oculta la nota sin error` | no aparece error ni nota | MSW |
| `estado 404 muestra no identificado` | texto propuesto | MSW |
| `estado 429 muestra el texto fijo sin reintento` | una petición | MSW + spy |
| `no muestra Total pagado ni Cuotas por defecto` | no aparece "Total pagado" ni "Cuotas" | Testing Library |
| `no hay botón de descarga` | no aparece "Descargar comprobante" | Testing Library |
| `sessionStorage que lanza muestra no identificado` | sin excepción | spy que lanza |
| `no escribe en storage` | spies sin llamadas | spy |
| `no tiene violaciones de accesibilidad` | axe | vitest-axe |

## 11. Criterios de aceptación

1. La decisión DB-W8-1 está registrada en el PR con la opción elegida (revisión).
2. Sin `numeroPago`, la pantalla muestra "no identificado" y no hace peticiones (test).
3. Con `APROBADO`, el `h1` "Pago aprobado" tiene foco y el bloque tiene `role="status"` (tests).
4. El número de operación es el `numeroPago` del back (test).
5. La fecha se muestra en hora de Buenos Aires desde UTC (test).
6. `PENDIENTE` y `RECHAZADO` tienen sus textos; no hay polling automático (tests).
7. La nota aparece solo con `PENDIENTE_CAE` (tests).
8. El 404 de factura no es un error visible (test).
9. No aparecen total, cuotas, PDF ni botón de comprobante (tests).
10. Nada se escribe en storage (test).
11. En 390 px la tarjeta ocupa el ancho disponible y los botones quedan apilados (verificación manual).
12. `lint`, `typecheck`, `test` y `build` en verde (FC8).

## 12. Verificación manual

1. Completar un pago en W6 con el backend y MSW (`VITE_USE_MOCKS=true`), luego volver a `/pago/exito`.
2. Con MSW en modo APROBADO: título, número de operación, fecha, nota de factura.
3. Forzar `PENDIENTE` en el mock: "Verificando el pago" sin peticiones repetidas en Network.
4. Abrir `/pago/exito` en una pestaña nueva: aparece "No pudimos identificar tu pago.".
5. Borrar `sessionStorage` y recargar: mismo resultado.
6. DevTools en 390 px: la tarjeta ocupa el ancho; sin scroll horizontal.
7. Confirmar al equipo DB-W8-1 y el texto propuesto de verificación antes del PR.

## 13. Decisiones pendientes con su default

| ID | Tema | Default | Fuente |
|---|---|---|---|
| **DB-W8-1 (RV-D17)** | DNI y número de póliza en el retorno | **[CONFIRMAR]** seguridad, antes de W-06. Opción A (FB8): el back acepta `numeroPago` sin DNI (PB-01 y factura). Hasta entonces, MSW con ese body y desviación marcada. Sin A, la pantalla no puede mostrar cuotas ni número de póliza. No cerrar sin confirmación del equipo: seguridad | W6 D3; FC12; W4 D15; RV-D17 |
| W6 D1 (bloqueante) | Estado sin endpoint público | MSW con PB-01 | W6 §13 D1 |
| W6 D2 (bloqueante) | Resultados que no son aprobado | Textos propuestos de la sección 8 | W6 §13 D2 |
| W6 D3 (bloqueante) | URL de retorno sin parámetros | `numeroPago` en `sessionStorage` (W-06); la URL de retorno con `numeroPago` es pedido al back | W6 §13 D3 |
| DN-W8-1 (W6 D5) | "Número de operación" | `numeroPago` del back (`PAG-xxxxxx`), no la referencia de la pasarela | W6 §13 D5 |
| DN-W8-2 (W6 §9.3) | "Total pagado" | No se muestra hasta que el back exponga el importe confirmado | W6 §9.3 |
| DN-W8-3 (W6 D10, D1 de cuotas) | Cuotas y subtítulo | Se muestran solo si el back las expone; subtítulo genérico por defecto | W6 §5 |
| DN-W8-4 (W6 D12) | "Volver a mi póliza" | Lleva a `/consultar-poliza` (W3 requiere `dni` y `numeroPoliza`) | W6 §8 |
| DN-W8-5 (W6 D8) | Factura autorizada | Nota oculta; CAE sin diseño | W6 §7, D8 |
| DN-W8-6 (W6 D9) | "Te la enviamos por email…" | Segunda frase omitida hasta confirmar el envío (no hay requisito en `tareas-divididas.md`) | W6 D9 |
| DN-W8-7 (W6 D7) | Fecha | Hora de Buenos Aires desde UTC | W6 D7; FB4 |
| D-22 | "Número de operación" | `numeroPago` | INDEX D-22 |
| D-06 | Descarga de comprobante | Sin botón | INDEX D-06 |

## 14. Riesgos y errores comunes

- **Mostrar "Pago aprobado" sin confirmación:** un `POST /api/publico/factura` 200 es la única señal de aprobación hoy, y un pago pendiente da 404 igual que uno rechazado (`pagos-facturas.md` §5 paso 6). Sin PB-01, un 404 no puede convertirse en "rechazado". Por eso el estado sale de `pagos/estado` y no se infiere.
- **Guardar el DNI para poder consultar:** prohibido por FC12 y W4 D15. Es el punto de la decisión bloqueante. No resolverlo a escondidas en el código.
- **Polling que rompe RN20:** un intervalo de 6 s ya cumple el límite de 10 por minuto junto con las demás llamadas. Sin polling.
- **Zona horaria:** `fechaAcreditacion` viene en UTC. Mostrarla sin convertir es un error de tres horas (FB4).
- **Número distinto:** el número del Figma (PA-7741-2093) no es el del back (PAG-xxxxxx). No copiar el del Figma.
- **Cuotas plural:** "Pagaste las cuotas 8 y 9" requiere datos que hoy no llegan. No inventar cuotas.

## 15. Definición de terminado

- DB-W8-1 (opción A, RV-D17) registrada en el PR; la confirmación de seguridad del equipo llega antes de W-06.
- `lint`, `typecheck`, `test` y `build` en verde (FC8).
- Accesibilidad con US-FE-T-19: `role="status"`, foco al `h1`, `<dl>`, sin violaciones de axe.
- Sin secretos; nada del DNI en storage; sin polling.
- Los 12 criterios de la sección 11 tildados con evidencia (FC6).
- PB-01 comunicado al back con el contrato y la opción A o B elegida.

## 16. Observaciones al índice

- Resuelto (RV-D17): FC12 se mantiene (solo `numeroPago` en `sessionStorage`); W-08 usa `numeroPago` y el back debe aceptarlo sin DNI (PB-01), con MSW hasta entonces.
- Resuelto (RV-D17): con la opción A, W-08 no necesita los tipos de `consulta` de W-03 para mostrar el estado; no se agrega dependencia de W-03.
- ABIERTO: **Subtítulo y cuotas.** La fila de W-08 no dice que "Pagaste las cuotas…" depende de datos que el back no expone hoy. Conviene anotarlo en PB-01. (No está en REVISION ni en FB8; PB-01 vive en `pedidos-al-back.md`, doc PR aparte.)
- ABIERTO: **Pantalla dependiente de la pasarela.** La URL de retorno (`Pagos:UrlRetornoExito`) no tiene `numeroPago` (W6 D3). Hay que coordinar con back la configuración por entorno. (No está en REVISION ni en FB8.)
