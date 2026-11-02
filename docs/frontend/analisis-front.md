# Análisis consolidado del frontend

Documento de arquitectura del frente de frontend. Consolida `00-decisiones-base.md` (FB1..FB7, manda sobre cualquier otro documento), `design-system.md`, `contratos-api/*.md` (5 archivos), `pantallas/*.md` (W1..W6, B1..B14) y el código del back. Los riesgos detallados van en `pedidos-al-back.md` (escrito en paralelo), enlazado en la sección 10.

Convenciones: las citas van entre paréntesis con el documento de origen, por ejemplo `(pantallas/B9-polizas.md §9)`. Las rutas de pantalla son **propuestas** salvo que se indique lo contrario. "NO DEFINIDO" significa que ningún documento lo fija.

---

## 1. Visión general

### 1.1 Las dos aplicaciones

| App | Carpeta | Usuarios | Autenticación | Pantallas |
|---|---|---|---|---|
| Backoffice | `apps/backoffice` | Empleado y Administrador | JWT (`Authorization: Bearer`) | B1..B14 |
| Web pública | `apps/web-publica` | Clientes titulares de una póliza, sin login | Ninguna (`/api/publico/*`, rate limit RN20) | W1..W6 |

(FB2; `design-system.md §0`; `contratos-api/seguridad-clientes-publico.md §2.1`)

Regla de roles: un Administrador pasa todas las guardas de Empleado. El front decide la visibilidad por el campo `rol` del login, nunca por nombre de política (`contratos-api/convenciones-transversales.md §2.3`). Los clientes no tienen usuario (RN17) (`contratos-api/seguridad-clientes-publico.md §2.1`).

Roles por pantalla:
- Solo Administrador: B13 Planes, B14 Usuarios (`pantallas/B13-planes.md §1`, `pantallas/B14-usuarios.md §1`). Su sidebar se oculta para Empleado (FB7.10).
- Empleado o Administrador: resto del backoffice (`pantallas/B2-inicio.md §2`, `pantallas/B9-polizas.md §1`, etc.).
- Público: W1..W6, sin guarda de sesión (`pantallas/W1-inicio.md §2`).

### 1.2 Relación con el back (una línea por frente)

- **Frente 1 (clientes, usuarios, auth, consulta pública):** login, alta de usuarios y consulta pública implementados; clientes en PR #50 (sin merge); listado, detalle, modificación y baja de clientes especificados (`contratos-api/seguridad-clientes-publico.md §0`).
- **Frente 2 (vehículos, planes, cotizaciones):** implementado en `development`, excepto `POST /api/externo/cotizaciones` (PR #57, no usado por el front) (`contratos-api/vehiculos-planes-cotizaciones.md §10`).
- **Frente 3 (pólizas, cuotas, Pago Fácil):** pólizas, cupón para empleados, rendiciones y base positiva implementados; el cupón público `POST /api/publico/cupon` está especificado (`contratos-api/polizas-cuotas-pagofacil.md §13`).
- **Frente 4 (pagos y facturas):** caja, pago online, factura pública y conciliación implementados; no hay endpoint público de estado del pago ni listado de pagos (`contratos-api/pagos-facturas.md §1`, §12).

---

## 2. Mapa de rutas

### 2.1 Backoffice

| Ruta propuesta | Pantalla (Figma, nodo) | Feature dueño | Guarda | Rol | Fuente |
|---|---|---|---|---|---|
| `/login` | B1 Login (18:2178) | `auth` | Pública; si hay sesión vigente, redirige a `/inicio` | Ninguno | B1 §2 |
| `/inicio` | B2 Inicio (18:236) | `inicio` (compone `polizas`, `cuotas`, `pago-facil`) | JWT | Empleado o Admin | B2 §2 |
| `/clientes` | B3 Clientes (18:2387) | `clientes` | JWT | Empleado o Admin | B3 §2 |
| `/clientes/nuevo` | B4 Nuevo cliente (22:366) | `clientes` | JWT | Empleado o Admin | B4 §2 |
| `/clientes/:clienteId` | B5 Ficha de cliente (23:922) | `clientes` (+ `vehiculos`, `polizas`, `cuotas`) | JWT | Empleado o Admin | B5 §2 |
| `/clientes/:clienteId/vehiculos/nuevo` | B6 Nuevo vehículo | `vehiculos` | JWT | Empleado o Admin | B6 §2 |
| `/cotizaciones/nueva?vehiculoId&clienteId` | B7 Cotizar (22:594) | `cotizaciones` | JWT | Empleado o Admin | B7 §2 |
| `/polizas/nueva?cotizacionId` | B8 Emitir póliza | `polizas` | JWT | Empleado o Admin | B8 §2 |
| `/polizas` | B9 Pólizas | `polizas` | JWT | Empleado o Admin | B9 §2 |
| `/polizas/:id` | B10 Detalle de póliza | `polizas` (+ `pagos`, `pago-facil`) | JWT | Empleado o Admin | B10 §2 |
| `/pagos` | B11 Pagos y facturas | `pagos` | JWT | Empleado o Admin | B11 §2 |
| `/pago-facil` | B12 Pago Fácil | `pago-facil` | JWT | Empleado o Admin | B12 §2 |
| `/planes` | B13 Planes | `planes` | JWT | Solo Admin | B13 §2 |
| `/usuarios` | B14 Usuarios | `usuarios` | JWT | Solo Admin | B14 §2 |

Conflictos de rutas (ver sección 11): `/inicio` vs `/` en B11; `/pago-facil` vs `/pago-facil/rendiciones` y `/pago-facil/base-positiva` en B2; colisiones `/clientes/nuevo` vs `/clientes/:clienteId` y `/polizas/nueva` vs `/polizas/:id`. Se resuelven con rutas estáticas antes que dinámicas en el router, pero hay que fijarlo en la tarea del router.

Destinos de sidebar sin pantalla: Vehículos, Cotizaciones, Pagos y facturas (se resuelve en B11), Pago Fácil (B12) (`pantallas/B2-inicio.md §8`).

### 2.2 Web pública

| Ruta propuesta | Pantalla (Figma, nodo) | Feature dueño | Guarda | Fuente |
|---|---|---|---|---|
| `/` | W1 Inicio (18:201) | `inicio` (público) + `planes` | Ninguna | W1 §2 |
| `/consultar-poliza` | W2 Consultar póliza (18:90) | `polizas` | Ninguna | W2 §2 |
| `/poliza` | W3 Mi póliza (18:47) | `polizas` | Sin `location.state` válido: redirige a `/consultar-poliza` | W3 §2 |
| `/poliza/pagar/medio-de-pago` | W4 Elegir medio de pago (18:1019) | `pagos` | Sin estado válido: redirige a `/consultar-poliza`; `cuotaIds` vacío o >24: redirige a `/poliza` | W4 §2 |
| `/poliza/pagar/pago-facil` | W5 Cupón Pago Fácil (18:2081) | `pago-facil` | Sin estado: `/consultar-poliza`; `cuotaIds` vacío: `/poliza/pagar/medio-de-pago` | W5 §2 |
| `/pago/exito` | W6 Pago aprobado (18:2308) | `pagos` | Sin datos de retorno: estado "no identificado" (NO DEFINIDO) | W6 §2 |

Destino de navegación: W3 pasa a W4 con `dni`, `numeroPoliza` y `cuotaIds` en `location.state`, nunca en la URL (W3 §8; W4 §2).

---

## 3. Mapa de features (arquitectura screaming)

### 3.1 Reglas (FB3)

- Cada app tiene `src/app/` (providers, router, layouts, guardas), `src/features/<dominio>/` y `src/shared/`.
- Un feature importa de otro solo por su `index.ts`. `pages/` compone; no calcula.
- Nombres de feature en español, términos del dominio del back.

### 3.2 Features del backoffice

| Feature | Contiene | Pantallas | Endpoints (estado) |
|---|---|---|---|
| `auth` | login, sesión, guardas por rol | B1 | `POST /api/auth/login` (Implementado) |
| `inicio` | saludo, KPIs, widgets de tareas y promo | B2 | Ver matriz; mayoría de widgets sin endpoint |
| `clientes` | listado, filtros, alta con Renaper, ficha, edición, baja | B3, B4, B5 | `GET/POST /api/clientes*` (ver matriz) |
| `vehiculos` | alta de vehículo, lista por cliente, uso | B6 (y lista en B5) | `POST /api/vehiculos`, `GET /api/vehiculos` (Implementado) |
| `cotizaciones` | cotizar un vehículo | B7 | `POST/GET /api/cotizaciones` (Implementado) |
| `polizas` | emisión, listado, detalle, cancelación, cuotas | B8, B9, B10 (y W2/W3 en la web) | `/api/polizas*` (Implementado) |
| `cuotas` | widget de cuotas vencidas, cuenta del cliente (`CuentaWidget`) | B2, B5 | Listado global NO EXISTE; `GET /api/polizas/{id}/cuotas` (Implementado) |
| `pagos` | listado, caja, factura | B11, B10 | `POST /api/pagos/caja`, `GET /api/pagos/{id}`, `GET /api/pagos/{id}/factura` (Implementado); listado NO EXISTE |
| `pago-facil` | rendición, historial, base positiva, promo | B12, B2 (promo), B10 (cupón) | `/api/pagofacil/*` (Implementado) |
| `planes` | ABM de planes | B13 | `GET/POST/PUT/DELETE /api/planes*` (Implementado); lista de inactivos y reactivación NO EXISTE |
| `usuarios` | alta de empleado o admin | B14 | `POST /api/auth/usuarios` (Implementado); listado NO EXISTE |

Nota: B11 (`pantallas/B11-pagos-y-facturas.md §9`) y B10 (`pantallas/B10-detalle-poliza.md`) necesitan leer pagos; el listado no existe, así que `pagos` expone solo lo implementado.

### 3.3 Features de la web pública

| Feature | Pantallas | Endpoints |
|---|---|---|
| `inicio` | W1 (hero, cómo pagar, footer) | Ninguno propio; compone `planes` |
| `planes` | W1 (`TablaPlanes`) | `GET /api/planes` (Implementado, anónimo) |
| `polizas` | W2 (formulario de consulta), W3 (detalle y selección de cuotas) | `POST /api/publico/consulta` (Implementado) |
| `pagos` | W4 (medio de pago), W6 (resultado) | `POST /api/publico/pagos`, `POST /api/publico/factura` (Implementados) |
| `pago-facil` | W5 (cupón) | `POST /api/publico/cupon` (Especificado) |

### 3.4 Compartido

- `packages/ui` (`@nexa/ui`): tokens CSS (`tokens.css`), preset Tailwind de `@nexa/config`, primitivos `Button`, `Input`, `Select`, `Badge/Estado` (`EstadoBadge`), `Chip`, `NavItem`, `Logo/Nexa`, `Sidebar`, `Topbar`, `Table` (Header/Row), `CardWidget`, `Shell`, `Backdrop`, `PublicNav`, `PublicFooter`, `AlertaError` (lo usan B1 y B4), `Dato` (par etiqueta/valor) y `Tabs` (propuesta para `ClienteTabs`, B5 §4). Fuentes: `design-system.md §5` y `pantallas/*.md §4`.
- `packages/api` (`@nexa/api`): cliente HTTP base, lectura de `ProblemDetails`/`ValidationProblemDetails`, tipos DTO y mapas de enums, formateadores de importe (`es-AR`) y fecha (`America/Argentina/Buenos_Aires`), y `mocks/` (MSW). FB1, FB2, FB4, FB7.3, FB7.7.
- `packages/config` (`@nexa/config`): `tsconfig`, reglas de ESLint y el preset de Tailwind (`design-system.md §4`).
- Componentes que `design-system.md` no define pero las pantallas piden: `EstadoResultadoPago` (W6, propuesta), `OpcionMedioPago` (W4, feature `pagos`), `CuponBarras` (W5). Estos se quedan en su feature salvo que se reutilicen.

### 3.5 Árbol de carpetas de `frontend/` hasta nivel feature

```
frontend/
  apps/
    backoffice/
      src/
        app/                     # router, providers, LayoutBackoffice (sidebar+topbar), guardas
        features/
          auth/
          inicio/
          clientes/
          vehiculos/
          cotizaciones/
          polizas/
          cuotas/
          pagos/
          pago-facil/
          planes/
          usuarios/
        shared/                  # hooks genéricos, PaginacionTabla si se reutiliza
    web-publica/
      src/
        app/                     # router, providers, PublicLayout (PublicNav + PublicFooter)
        features/
          inicio/
          planes/
          polizas/
          pagos/
          pago-facil/
        shared/
  packages/
    ui/src/                      # tokens.css, primitivos (sección 3.4)
    api/src/                     # cliente HTTP, errores, tipos DTO, enums, formateadores
    api/mocks/                   # handlers MSW
    config/                     # tsconfig, eslint, tailwind/nexa.preset.js
```

Cada feature sigue el esquema FB3: `api/`, `components/`, `pages/`, `schemas/`, `types/`, `index.ts`.

---

## 4. Matriz pantalla ↔ endpoint

Estados: **Implementado** (existe en `development`), **En PR #N**, **Especificado** (solo spec/tareas), **NO EXISTE** (ni código, ni PR, ni tarea). Fuente de estados: `contratos-api/*.md` y cada pantalla §9.

### 4.1 Web pública

| Pantalla | Endpoint | Estado | Feature que lo llama |
|---|---|---|---|
| W1 | `GET /api/planes` | Implementado | `planes` |
| W2 | `POST /api/publico/consulta` | Implementado | `polizas` |
| W3 | `POST /api/publico/consulta` (reuso del resultado de W2) | Implementado | `polizas` |
| W3 | `POST /api/publico/cupon` | Especificado | `pago-facil` (desde W3) |
| W3 | `GET /api/pagofacil/cuotas/{id}/cupon` | Implementado, **solo Empleado** (no usar desde web pública) | — |
| W4 | `POST /api/publico/pagos` | Implementado | `pagos` |
| W5 | `POST /api/publico/cupon` | Especificado | `pago-facil` |
| W6 | `POST /api/publico/consulta` (estado de cuotas) | Implementado | `pagos` |
| W6 | `POST /api/publico/factura` | Implementado | `pagos` |
| W6 | Estado público del pago | NO EXISTE | — |
| W6 | Descarga de comprobante | NO EXISTE | — |

Fuentes: `pantallas/W1-inicio.md §9`, `W2 §9`, `W3 §9`, `W4 §9`, `W5 §9`, `W6 §9`.

### 4.2 Backoffice

| Pantalla | Endpoint | Estado | Feature |
|---|---|---|---|
| B1 | `POST /api/auth/login` | Implementado | `auth` |
| B2 | `GET /api/polizas?estado=X&pagina=1&tamano=1` (5 llamadas, conteos) | Implementado | `inicio` |
| B2 | Nombre del usuario (`GET /api/auth/yo` propuesto) | NO EXISTE | `inicio` |
| B2 | Cuotas vencidas (listado y conteo) | NO EXISTE | `inicio` / `cuotas` |
| B2 | Tareas del día | NO EXISTE | `inicio` |
| B2 | Rendiciones (historial para la promo) | Implementado (`GET /api/pagofacil/rendiciones`) | `pago-facil` |
| B3 | `GET /api/clientes?dni=&apellido=&pagina=&tamanoPagina=` | Especificado (US-F1-06) | `clientes` |
| B4 | `POST /api/clientes` | En PR #50 | `clientes` |
| B4 | `GET /api/clientes/renaper/{dni}` | En PR #50 | `clientes` |
| B4 | `POST /api/clientes/{id}/validar-renaper` (desde B3/B5) | En PR #50 | `clientes` |
| B5 | `GET /api/clientes/{id}` | Especificado | `clientes` |
| B5 | `PUT /api/clientes/{id}`, `DELETE /api/clientes/{id}` | Especificado | `clientes` |
| B5 | `GET /api/vehiculos?clienteId=` | Implementado | `vehiculos` |
| B5 | `GET /api/polizas?clienteId=` | Implementado | `polizas` |
| B5 | `GET /api/polizas/{id}/cuotas` (próxima cuota) | Implementado | `cuotas` |
| B5 | Deuda consolidada del cliente para Empleado | NO EXISTE (`/api/externo/.../deuda` es solo API key) | `cuotas` |
| B6 | `POST /api/vehiculos` | Implementado | `vehiculos` |
| B6 | Vista previa DNRPA por patente | NO EXISTE | `vehiculos` |
| B6 | `GET /api/clientes/{id}` | Especificado | `vehiculos` |
| B7 | `POST /api/cotizaciones` | Implementado | `cotizaciones` |
| B7 | `GET /api/cotizaciones/{id}` | Implementado | `cotizaciones` |
| B7 | `GET /api/planes` | Implementado | `cotizaciones` |
| B7 | `GET /api/vehiculos/{id}` | Implementado | `cotizaciones` |
| B7 | `GET /api/clientes/{id}` (edad del conductor) | Especificado | `cotizaciones` |
| B8 | `POST /api/polizas` | Implementado | `polizas` |
| B8 | `GET /api/cotizaciones/{id}`, `GET /api/vehiculos/{id}`, `GET /api/planes/{id}` | Implementado | `polizas` |
| B8 | `GET /api/clientes/{id}` (nombre) | Especificado | `polizas` |
| B9 | `GET /api/polizas` (`estado`, `clienteId`, `patente`, `pagina`, `tamano`) | Implementado | `polizas` |
| B9 | `GET /api/clientes?dni=` (resolver DNI) | Especificado | `polizas` |
| B9 | Búsqueda por número de póliza o DNI directa | NO EXISTE | `polizas` |
| B9 | `GET /api/planes`, `GET /api/vehiculos/{id}` | Implementado | `polizas` |
| B10 | `GET /api/polizas/{id}`, `GET /api/polizas/{id}/cuotas` | Implementado | `polizas` |
| B10 | `POST /api/polizas/{id}/cancelar` | Implementado | `polizas` |
| B10 | `POST /api/pagos/caja` | Implementado | `pagos` |
| B10 | `GET /api/pagos/{id}`, `GET /api/pagos/{id}/factura` | Implementado | `pagos` |
| B10 | `GET /api/pagofacil/cuotas/{cuotaId}/cupon` | Implementado | `pago-facil` |
| B10 | Lista de pagos de una póliza | NO EXISTE | `pagos` |
| B11 | `GET /api/pagos` (listado con filtros) | NO EXISTE | `pagos` |
| B11 | Búsqueda de póliza por número | NO EXISTE | `pagos` |
| B11 | Reintento de factura | NO EXISTE | `pagos` |
| B11 | `POST /api/pagos/caja` (cobro desde el rail) | Implementado | `pagos` |
| B12 | `POST /api/pagofacil/rendiciones` (multipart `archivo`) | Implementado | `pago-facil` |
| B12 | `GET /api/pagofacil/rendiciones` | Implementado | `pago-facil` |
| B12 | `GET /api/pagofacil/base-positiva` | Implementado | `pago-facil` |
| B12 | Historial de bases generadas | NO EXISTE | `pago-facil` |
| B13 | `GET /api/planes` | Implementado (solo activos) | `planes` |
| B13 | `POST /api/planes`, `PUT /api/planes/{id}` | Implementado | `planes` |
| B13 | `DELETE /api/planes/{id}` (desactivar) | Implementado | `planes` |
| B13 | Listado de inactivos y reactivación | NO EXISTE | `planes` |
| B14 | `POST /api/auth/usuarios` | Implementado | `usuarios` |
| B14 | `GET /api/usuarios` (listado) y edición o baja | NO EXISTE | `usuarios` |

Fuentes: `pantallas/B*-*.md §9` y `contratos-api/*.md`.

### 4.3 Resumen

Criterio: **lista** = todos los endpoints de la pantalla Implementados y sin dato bloqueante abierto. **Parcial** = algún dato o endpoint faltante, pero la pantalla se puede construir con lo implementado (con MSW para el resto). **Bloqueada** = el núcleo de la pantalla depende de un endpoint Especificado, en PR o inexistente.

- **Listas para integrar contra el back real (2):** W2, B1.
- **Parciales (13):** W1, W3, W4, W6, B2, B6, B7, B8, B9, B10, B12, B13, B14.
- **Bloqueadas (5):** W5 (cupón público especificado), B3 (listado de clientes especificado), B4 (PR #50 sin merge), B5 (detalle de cliente especificado y cuenta sin endpoint), B11 (listado de pagos inexistente).

Total: 20 pantallas.

---

## 5. Flujos de negocio punta a punta

Cada paso indica pantalla, endpoint y manejo de error. Códigos de error según `contratos-api/*.md` y FB7.6 (la UI muestra `detail`; marca un campo solo si llega `errors`).

### 5.1 Login de empleado

```
B1 /login → POST /api/auth/login → 200 {token, rol, expiraEn} → sesión → B2 /inicio
```

| Paso | Pantalla | Endpoint | Error |
|---|---|---|---|
| Enviar email y contraseña | B1 | `POST /api/auth/login` | 400 `errors.Email`/`errors.Password` en el campo; 401 `detail` "Credenciales inválidas." en el formulario sin redirigir (no hay redirección por 401 en login); 500 mensaje genérico |
| Éxito | B1 | — | Guardar token, rol, `expiraEn` (FB7.5: JWT en memoria y `sessionStorage`, nunca `localStorage`) |
| Llamadas siguientes con 401 | Cualquier | — | Borrar sesión y redirigir a `/login` (FB7.5) |
| Vencimiento | Todas | — | Al llegar a `expiraEn` (ClockSkew 0, conviene margen de 5 s) (`contratos-api/seguridad-clientes-publico.md §2.1`) |

Sin refresh ni logout en el servidor: cerrar sesión es descartar el token (`contratos-api/convenciones-transversales.md §2.2`).

### 5.2 Alta de cliente con validación Renaper

```
B4 (completar DNI) → GET /api/clientes/renaper/{dni} (opcional, precarga)
   → POST /api/clientes → 201 ClienteResponse (validadoRenaper true | false)
   → B3 con aviso
```

| Paso | Pantalla | Endpoint | Error |
|---|---|---|---|
| Previsualizar Renaper | B4 | `GET /api/clientes/renaper/{dni}` (PR #50) | 400 `DNI debe tener 8 dígitos`; 404 `codigo: PERSONA_NO_ENCONTRADA` → error en campo DNI; 502 Renaper caído |
| Guardar | B4 | `POST /api/clientes` (PR #50) | 400 de validación (`errors`, mapear a campo); 400 de negocio sin `codigo` (DNI o email duplicado, menor de 18, fallecido, no figura): alerta general con `detail` sin prefijo `RNxx:`; 201 con `validadoRenaper=false` si Renaper cayó: aviso y badge "Pendiente" |
| Reintentar validación | B3/B5 | `POST /api/clientes/{id}/validar-renaper` (PR #50) | 404 `CLIENTE_NO_ENCONTRADO`; 400 sin código; 502 |

Renaper caído en el alta devuelve **201** (no 502). La spec deja la decisión como pendiente (C8) (`pantallas/B4-nuevo-cliente.md §7, §13 D-9`).

### 5.3 Cotizar → emitir póliza

```
B5 o B9 → B7 /cotizaciones/nueva?vehiculoId&clienteId → POST /api/cotizaciones (201, opciones[])
   → elegir opción → B8 /polizas/nueva?cotizacionId → POST /api/polizas (201) → B10 /polizas/:id
```

| Paso | Pantalla | Endpoint | Error |
|---|---|---|---|
| Cotizar | B7 | `POST /api/cotizaciones` `{vehiculoId}` | 400 "Ningún plan es compatible con el vehículo."; 400 vehículo dado de baja; 404 vehículo o cliente inexistente |
| Carga de datos de la opción | B7 | `GET /api/planes`, `GET /api/vehiculos/{id}` | Error de carga: mensaje y reintento |
| Emitir | B8 | `POST /api/polizas` `{cotizacionId, vigenciaMeses}` | 400 con `detail` tal cual (reglas 2 a 16 de `contratos-api/polizas-cuotas-pagofacil.md §4.2`); 404 cotización inexistente; no reintentar automáticamente (FB7.9) |
| Éxito | B8 | — | 201 `PolizaDetalleResponse`; redirigir a `/polizas/:id` |

B7 "Guardar cotización" no tiene endpoint: cada cotización ya queda guardada (`pantallas/B7-cotizar.md D-B7-07`).

### 5.4 Consulta pública de póliza → pago online (pasarela)

```
W2 /consultar-poliza → POST /api/publico/consulta → W3 /poliza (location.state)
   → elegir cuotas → W4 /poliza/pagar/medio-de-pago → POST /api/publico/pagos (201)
   → window.location.assign(urlPago) → pasarela → retorno UrlRetornoExito → W6 /pago/exito
```

| Paso | Pantalla | Endpoint | Error |
|---|---|---|---|
| Consultar | W2 | `POST /api/publico/consulta` | 400 mensajes del campo; 404 "No se encontró un registro con los datos indicados." (FB7.6: mostrar `detail`; W2 propone el texto del Figma, ver §11); 429 "Se superó el límite de intentos. Volvé a intentarlo en un minuto." sin `Retry-After` |
| Ver cuotas | W3 | (reuso del resultado) | Sin estado de navegación: redirigir a W2 |
| Iniciar pago | W4 | `POST /api/publico/pagos` | 400 reserva C8 "Alguna de las cuotas ya tiene un pago en curso…"; 400 proveedor inválido; 400 cuotas no pagables (RN11); 404 DNI y póliza no coinciden; 429; 502 pasarela caída (pago `RECHAZADO`, cuotas sin cambio) |
| Antes de redirigir | W4 | — | Guardar `numeroPago` (`sessionStorage`), nunca el DNI |
| Resultado | W6 | `POST /api/publico/consulta`, `POST /api/publico/factura` | Sin endpoint de estado: ver §11 y `pedidos-al-back.md` |

Doble clic: un solo POST en vuelo y sin reintento automático de POST (FB7.9). Tras un error de red, no reenviar a ciegas (`contratos-api/pagos-facturas.md §9.2`).

### 5.5 Consulta pública → cupón Pago Fácil

```
W3 o W4 → W5 /poliza/pagar/pago-facil → POST /api/publico/cupon (Especificado)
```

| Paso | Pantalla | Endpoint | Error |
|---|---|---|---|
| Pedir cupón | W5 | `POST /api/publico/cupon` (Especificado) | Bloqueado hasta que el back lo publique; trabajar con MSW (FB4, FB7.7) |
| Errores previstos | W5 | (mismo) | 400 cuota pagada, anulada o inexistente (RN11); 404 genérico; 429 |

Pago Fácil con más de una cuota está sin definir: un cupón por cuota o un solo cupón (W4 D1, W5 D1, W3 §13 D5).

### 5.6 Cobro en caja

```
B10 (rail derecho) o B11 (rail derecho, por póliza) → seleccionar cuotas → POST /api/pagos/caja → 201 PagoResponse
   → factura en GET /api/pagos/{id}/factura
```

| Paso | Pantalla | Endpoint | Error |
|---|---|---|---|
| Cobrar | B10 / B11 | `POST /api/pagos/caja` `{cuotaIds}` | 400 cuotas pagadas o anuladas (RN11); 400 cuotas de dos clientes; 400 `RowVersion` "El pago o sus cuotas fueron modificados por otro cobro. Recargue los datos."; 404 cuota o póliza |
| Factura pendiente | B10 / B11 | `GET /api/pagos/{id}/factura` | `PENDIENTE_CAE` se muestra; 404 "No se encontró la factura del pago." |
| Error con pago ya aprobado | — | — | Si ARCA autorizó y falla la persistencia: 500 con pago `APROBADO` (sin procedimiento, `pagos-facturas.md §12` D6) |

### 5.7 Rendición Pago Fácil

```
B12 /pago-facil → subir .txt (multipart, campo "archivo") → POST /api/pagofacil/rendiciones
   → 201 RendicionResponse (procesadas, rechazadas, errores[])
```

| Paso | Pantalla | Endpoint | Error |
|---|---|---|---|
| Validar antes de enviar | B12 | — | Tamaño máximo 5 MB; nombre 1 a 90 caracteres, solo `A-Za-z0-9._-` (`RendicionService.cs:152-159`) |
| Subir | B12 | `POST /api/pagofacil/rendiciones` | 400 formato (`línea n: motivo; …` en `detail`, partir por `; `); 400 "ya fue procesado (RN18)"; 400 vacío; 500 a mitad del archivo (no reenviar con el mismo nombre) |
| Resultado | B12 | — | 201 con `rechazadas > 0` no es error de red. Sin GET por id: el resultado se pierde al salir (ofrecer copiar o descargar) |
| Historial | B12 | `GET /api/pagofacil/rendiciones` | Sin paginación |

Receta de código en `contratos-api/polizas-cuotas-pagofacil.md §11.1`.

### 5.8 Base positiva

```
B12 → botón "Generar base positiva" → GET /api/pagofacil/base-positiva (fetch con Authorization)
   → blob de texto → descarga con nombre construido desde el registro H
```

| Paso | Pantalla | Endpoint | Error |
|---|---|---|---|
| Descargar | B12 | `GET /api/pagofacil/base-positiva` | Chequear `res.ok` y `Content-Type` `text/plain` antes de guardar (un error JSON guardado como `.txt` falla en silencio); 400 si una cuota no arma el código de barras (falla el archivo entero); 500 |
| Nombre | B12 | — | `Content-Disposition` no es legible cross-origin (`Program.cs:50-54`): armar `BASEPOS_<empresa>_<yyyyMMdd>.txt` desde el registro `H` |

Receta en `contratos-api/polizas-cuotas-pagofacil.md §11.2`. El link `<a href>` directo no sirve: el endpoint exige `Authorization`.

---

## 6. Modelo de datos del front

### 6.1 Tipos que expone `@nexa/api`

Se exportan como tipos TypeScript (nombres de los DTO sin renombrar, FB3 regla 5). Lista agrupada por origen:

- **Comunes:** `ProblemDetails`, `ValidationProblemDetails`, `PaginaResponse<T>` (`items`, `pagina`, `tamanoPagina`, `total`; el request usa `tamano`, el response `tamanoPagina`).
- **Auth:** `LoginRequest`, `LoginResponse`, `RolUsuario = 'Administrador' | 'Empleado'`, `CrearUsuarioRequest`, `UsuarioResponse`.
- **Clientes (PR #50 y especificado):** `ClienteAltaRequest`, `ClienteResponse`, `PersonaRenaperResponse`, `DomicilioRenaperResponse`, `ClienteFiltro`, `ClienteModificacionRequest`. `ClienteResumenResponse` y la respuesta de detalle son NO DEFINIDO.
- **Vehículos y planes:** `VehiculoAltaRequest`, `VehiculoResponse`, `ModificarUsoRequest`, `PlanRequest`, `PlanResponse`.
- **Cotizaciones:** `CotizarVehiculoRequest`, `OpcionCotizacion`, `CotizacionResultado`, `CotizacionDto`.
- **Pólizas:** `EmitirPolizaRequest`, `PolizaFiltroQuery`, `PolizaListItemResponse`, `PolizaDetalleResponse`, `CuotaResponse`, `CancelarPolizaRequest`.
- **Pago Fácil:** `CuponPagoFacilResponse`, `RendicionResponse`, `ErrorLineaRendicion`, `HistorialRendicionResponse`.
- **Pagos y facturas:** `PagoCajaRequest`, `PagoResponse`, `FacturaResponse`, `PagoPublicoRequest`, `PagoPublicoResponse`, `PublicoFacturaRequest`.
- **Pública:** `ConsultaPublicaRequest`, `ConsultaPublicaResponse`, `PlanPublico`, `VehiculoPublico`, `CuotaPublica`.

Fuentes: `contratos-api/*.md`.

### 6.2 Mapa de enums (FB7.3)

Regla: `@nexa/api` define un mapa por enum (valor del back → literal TS → etiqueta de UI → variante de Badge). Ningún componente usa números crudos. El mapa se indexa por **(dominio, valor)**, no solo por valor (el mismo nombre puede ser `4` en `EstadoPoliza` y `1` en `EstadoCuota`, `convenciones-transversales.md §5.2`).

| Dominio | Wire | Valores (wire → literal TS) | Etiqueta UI | Variante Badge |
|---|---|---|---|---|
| `EstadoPoliza` | número (backoffice) | 0 `Pendiente`, 1 `Vigente`, 2 `Suspendida`, 3 `Cancelada`, 4 `Vencida` | Pendiente, Vigente, Suspendida, Cancelada, Vencida | Pendiente, Vigente, Suspendida, Cancelada, Vencida |
| `EstadoPoliza` (público) | string MAYÚSCULAS | `PENDIENTE`, `VIGENTE`, `SUSPENDIDA`, `CANCELADA`, `VENCIDA` | Igual | Igual |
| `EstadoCuota` | número (backoffice) | 0 `Pendiente`, 1 `Vencida`, 2 `Pagada`, 3 `Anulada` | Igual | Pendiente, Vencida, Pagada (= Vigente), Anulada (= Vencida) |
| `EstadoCuota` (público) | string | `PENDIENTE`, `VENCIDA`, `PAGADA`, `ANULADA` | Igual | Igual |
| `EstadoPago` | string | `PENDIENTE`, `APROBADO`, `RECHAZADO` | Sin badge de diseño (NO DEFINIDO) | — |
| `MedioPago` | string | `PASARELA`, `PAGO_FACIL`, `CAJA` | Sin badge de diseño (NO DEFINIDO) | — |
| `EstadoFactura` | string | `PENDIENTE_CAE`, `AUTORIZADA` | Pendiente CAE | Pendiente CAE (= Suspendida) |
| `TipoVehiculo` | número | 0 Auto, 1 Moto, 2 Camioneta | Auto, Moto, Camioneta | — |
| `UsoVehiculo` | número | 0 Particular, 1 Comercial | Particular, Comercial | — |
| `OrigenCotizacion` | número | 0 Web, 1 Panel, 2 Externo | No se muestra | — |
| Validado Renaper / DNRPA | booleano | `validadoRenaper`, `validadoDnrpa` | Validado / Pendiente | Validado (= Vigente) / Pendiente |
| `Sexo` | char | `M`, `F`, `X` | Femenino, Masculino, X (propuesta, B4 D-11) | — |
| `Rol` | string | `Administrador`, `Empleado` | Mismos | Chip (B14) |

Fuentes: `contratos-api/convenciones-transversales.md §5.1, §8`; `polizas-cuotas-pagofacil.md §2`; `pagos-facturas.md §3`.

Observaciones:
- FB7.3 dice que solo `PagoResponse` y `FacturaResponse` mandan string. Eso no es completo: la consulta pública (`ConsultaPublicaResponse`, `CuotaPublica`, `DeudaExternaCuota`) también manda strings MAYÚSCULAS (§11).
- `PlanRequest.tiposPermitidos` usa nombres (`Auto,Moto,Camioneta`), no números: única excepción de tipo en la API (`vehiculos-planes-cotizaciones.md §3.2`).
- Los enums en request bodies viajan como número (`VehiculoAltaRequest.uso`, `ModificarUsoRequest.uso`, `CotizacionExternaRequest`), y la query string acepta nombre o número (`convenciones-transversales.md §5.2`).

### 6.3 Estado global

Por FB7.5 y la especificación de cada pantalla, el estado global es **solo la sesión** del backoffice: `token`, `rol`, `expiraEn`. Todo lo demás es estado de servidor con TanStack Query.

Estado de navegación (no global): el resultado de consulta y las cuotas seleccionadas viajan en `location.state` del router (W2 a W5). `numeroPago` puede ir en `sessionStorage` (W4 §8). El DNI no se guarda en `localStorage` ni `sessionStorage`.

Sin estado global en la web pública (no hay sesión).

---

## 7. Estrategia de integración con el back

### 7.1 Capa de cliente HTTP

- Un único cliente en `@nexa/api`. Ningún componente hace `fetch` suelto (FB1).
- Concatena `VITE_API_BASE_URL` con rutas que ya empiezan con `/api/…` (la variable es solo el origen) (`convenciones-transversales.md §1.2`).
- Adjunta `Authorization: Bearer <token>` en endpoints protegidos. No usa cookies: el CORS no tiene `AllowCredentials` (`convenciones-transversales.md §1.4`).
- Parsea `application/problem+json`: `ValidationProblemDetails` (con `errors`) y `ProblemDetails` (con `detail`). Acepta ambas formas (`polizas-cuotas-pagofacil.md §1.4`).

### 7.2 Manejo de errores (FB7.6)

| Caso | Tratamiento |
|---|---|
| 400 con `errors` | Mapear por clave a un campo. Mostrar el texto propio del front, no el de `errors[...][0]` (vienen en inglés por defecto de ASP.NET) |
| 400 con `detail` | Mostrar `detail` en alerta general o formulario. No mostrar el prefijo `RN01:`/`RN02:` (B4 D-7) |
| 400 con `codigo` o prefijo de `detail` | Solo `VEHICULO_NO_ENCONTRADO` viene como prefijo de `detail`; `CLIENTE_NO_ENCONTRADO` y `PERSONA_NO_ENCONTRADA` vienen en `codigo` |
| 401 en login | Mensaje en el formulario, sin redirigir |
| 401 en cualquier otro endpoint | Borrar sesión y redirigir a `/login` (FB7.5) |
| 403 | Sin cuerpo garantizado: mensaje propio ("No tenés permiso para esta acción") |
| 404 | Según la pantalla (no encontrado o "cliente no existe") |
| 429 (`/api/publico/*`) | Mensaje fijo con el texto de espera. No reintentar: cada request cuenta contra el límite (10 por minuto por IP) |
| 502 | Mensaje de servicio externo (Renaper, DNRPA, pasarela); el texto no es fijo |
| 503 | `Retry-After: 15` solo en servicios no disponibles |
| 500 | `detail` "Ocurrió un error inesperado." y `traceId` para soporte |

Reglas transversales:
- `retry: 0` en toda mutación (FB7.9). Las consultas `/api/publico/*` tampoco reintentan ante 429 (`convenciones-transversales.md §4`).
- Nunca disparar una mutación de pago en el montaje de una pantalla (FB7.9).
- Sin `Retry-After` en 429, el front muestra un texto fijo de 60 s (`convenciones-transversales.md §4`).
- Headers no legibles desde JavaScript (`Location`, `Retry-After`, `Content-Disposition`) porque CORS no los expone: el id sale del body y el nombre de archivo se arma en el front (`convenciones-transversales.md §7.2`).

### 7.3 Formato de datos

- Importes: un único formateador `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })` en `@nexa/api`, mostrado como `$ 25.000,00` (`convenciones-transversales.md §5.4`; `W1 §9`). Nadie suma plata con `number` ni recalcula recargos (`convenciones-transversales.md §5.4`).
- Fechas `DateOnly` (`yyyy-MM-dd`): se muestran sin conversión de zona (`new Date("yyyy-MM-dd")` desplaza un día en Argentina) (`convenciones-transversales.md §5.3`).
- Fechas `DateTime`: tratar como UTC aunque no traigan `Z` (regla de FB7.4), mostrar en `America/Argentina/Buenos_Aires`. Pendiente de verificar en runtime (ver §11).
- DNI: se envía sin puntos (8 dígitos), se muestra con puntos (B3 D-10).

### 7.4 MSW y transición de mock a real (FB7.7, FB4)

- Mocks en `frontend/packages/api/mocks` (MSW), activados con `VITE_USE_MOCKS=true`.
- Cada endpoint tiene estado. Un endpoint **Especificado** o **En PR** se trabaja con mock. Un endpoint **Implementado** se conecta al real. Un endpoint **NO EXISTE** se mockea con el contrato mínimo que la tarea necesita, y se registra en `pedidos-al-back.md`.
- Pasar de mock a real: al publicar el endpoint, se elimina su handler MSW, se corre el test de contrato contra `VITE_API_BASE_URL` local y se ajustan los tipos si el DTO cambió (los docs piden revalidar cuando la PR cambie, `clientes` D14).
- Cada tarea bloqueada lista qué endpoints mockea y el contrato mínimo que espera (FB7.7).

### 7.5 CORS y variables de entorno

| Variable | Ejemplo local | Ejemplo producción | Uso |
|---|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` (Docker) o `http://localhost:5148` (`dotnet run`) | `https://api.nexaseguros.me` | Origen de la API (`convenciones-transversales.md §1.1`) |
| `VITE_USE_MOCKS` | `true` / `false` | `false` | Activa MSW (FB7.7) |

- Puertos del front: `backoffice` en `5173` y `web-publica` en `5174`, con `strictPort: true`. Coinciden con `Cors:AllowedOrigins` (`convenciones-transversales.md §1.4`). Hoy `vite.config.ts` no existe; es recomendación (`convenciones-transversales.md §1.2`).
- Un origen que no coincide con CORS falla en el navegador sin body legible (`convenciones-transversales.md §1.4`).
- Las variables `VITE_*` se incrustan en el bundle y son públicas: nunca `X-Api-Key` ni secretos (`convenciones-transversales.md §1.2`).
- El swagger no se usa en producción (`Swagger:Habilitado`) (`convenciones-transversales.md §1.3`).

---

## 8. Estrategia de testing y calidad

### 8.1 Herramientas (FB1)

- Vitest + Testing Library + MSW. Un test por regla de UI relevante.
- ESLint + Prettier + `eslint-plugin-boundaries` (hace cumplir FB3).
- TypeScript con `strict: true`, sin `any`.

### 8.2 Qué se prueba por capa

| Capa | Qué se prueba | Herramienta |
|---|---|---|
| `packages/api` | Parseo de `ProblemDetails` y `ValidationProblemDetails`; formateadores de importe y fecha; mapas de enums por (dominio, valor) | Vitest |
| `packages/ui` | Estados de `Input`/`Select` (Default, Focus, Error, Disabled); `Badge/Estado` por valor; `Chip` seleccionable | Testing Library |
| Schemas `zod` por feature | DNI 8 dígitos, CUIL 11, póliza `POL-` + 7, email, nombre de archivo de rendición | Vitest |
| Features (hooks y páginas) | Selección de cuotas y total (`useSeleccionCuotas`), guardas de ruta, redirección por 401 | Testing Library + MSW |
| Flujos críticos | Login, alta de cliente, cotizar y emitir, pago online (hasta `window.location.assign`), cupón, rendición | Testing Library + MSW (E2E no definido) |

### 8.3 Cobertura mínima por tipo de tarea

NO DEFINIDO en los documentos. Propuesta para aprobar en la reunión:
- Tarea de pantalla: un test por cada regla de validación, cada estado de la sección 7 de la pantalla y cada error mapeado.
- Tarea de endpoint integrado: test de contrato contra el DTO del `contratos-api/*.md` y un test de error por cada código de la tabla de la pantalla.
- Tarea de `packages/ui`: un test por estado de componente.

### 8.4 CI `frontend`

FB1 pide un check `frontend` con install, lint, typecheck, test y build, sin tocar los checks del back. El workflow actual define `backend`, `branch-name` y `secrets-scan` (`docs/workflow.md`, "Criterios de calidad"); el check `frontend` no existe todavía.

Requisitos del flujo: branch desde `development`, PR a `development`, Conventional Commits y prueba manual antes del PR cuando hay algo que probar a mano (`docs/workflow.md`, reglas 1 a 7).

---

## 9. Accesibilidad e i18n

### 9.1 Contrastes que fallan (design-system §8.1 y §1.1)

| Par | Ratio | Estado | Acción propuesta (en el documento) |
|---|---|---|---|
| `text/tertiary` (#8A8E93) sobre `surface/panel` | 3.30 | No cumple AA | Usar `text/secondary` para texto informativo; reservar tertiary para deshabilitado y decorativo |
| `text/tertiary` sobre `surface/sidebar` | 3.02 | No cumple AA | Usar `text/secondary` (5.79) |
| `status/suspendida/text` (#9A6400) sobre `status/suspendida/bg` | 4.42 | No cumple (faltan 0.08) | Oscurecer hasta ≥ 4.5 y revalidar. Afecta Badge Suspendida y Pendiente CAE |
| `border/strong` (#D3D5CE) sobre panel (borde de Input/Select) | 1.48 | No cumple 1.4.11 si el borde es la única señal | Subir el token del borde o agregar fondo distinto. Revisar con diseño |
| Caption tertiary de 11 px ("desde", "por mes", nota de Pago Fácil) | Probable < 4.5 | Verificar | `W1 §12`, `W3 §12` |
| `text/secondary` (#5C6066) sobre `accent/lime-soft` | Verificar | Pendiente | `W4 §12` |

FB7.8: se implementan los tokens como están en Figma y se registran como pedido a diseño. Nadie cambia colores por su cuenta.

### 9.2 Otros requisitos de accesibilidad

- Foco visible: Input y Select tienen foco de 2 px `action/primary` (17.61:1). Para Button, Chip, NavItem, Table/Row y Bell Figma no define foco; propuesta: `focus-visible` con anillo de 2 px y `outline-offset` de 2 px (`design-system.md §8.3`). No quitar nunca el outline sin reemplazo.
- Salto de layout del Input al pasar de 1 px a 2 px de borde: `box-sizing: border-box` (`design-system.md §8.4`).
- Tamaño táctil: los componentes cumplen 24 px (WCAG 2.5.8). Para mobile se propone `min-h-11` (44 px) en interactivos (`design-system.md §8.5`).
- Input: label visible asociado; nunca placeholder como label (nota del componente en Figma). Error con `aria-invalid` y `aria-describedby`.
- Errores de campo: el helper de error debe ser específico, no el texto de ayuda (WCAG 3.3.1) (`design-system.md §8.2`).
- Alertas de resultado (404, 429, errores de Renaper): `role="alert"` o `aria-live`.
- Tablas: `<table>` con `<th scope="col">`, `<caption>`.
- Pestañas (B5): patrón `tablist`/`tab`/`tabpanel`.
- Iconos decorativos con `aria-hidden` o `alt=""`. Botones solo con ícono (campana, ojo) con `aria-label`.
- Diálogo de baja (B5): `role="alertdialog"`, foco inicial en Cancelar.
- Primer foco: W6 y W5 al `h1`; B4 y B1 tras error, al campo.
- `lang="es"` en el HTML de cada app (`design-system.md §8.6`).
- Dependencia de color: el estado no puede depender solo del color (badge con texto, check con texto accesible) (`pantallas/W2 §12`, `W3 §12`).

### 9.3 i18n

- Un solo idioma: español. Sin librería de i18n definida en los documentos.
- Textos de UI tomados del Figma tal cual, incluido el voseo ("Consultá", "Ingresá", "Pagá") (FB5).
- Los `.md` van en español neutro; los textos de UI, como vienen del Figma (FB5).
- Números: `es-AR` (punto de miles, coma decimal). Fechas: `dd/mm/aaaa`, hora en `America/Argentina/Buenos_Aires`.
- Textos que no deben implementarse como texto fijo: nombres de muestra ("Tomás Iturralde", "Mariela Quiroga"), importes de muestra y valores "A confirmar" (`design-system.md §9.16`; `pantallas/W1 §9`).

---

## 10. Riesgos y huecos (resumen)

El detalle, con un pedido por cada punto, va en `pedidos-al-back.md`.

| # | Riesgo | Impacto | Pantallas | Fuente |
|---|---|---|---|---|
| R1 | Enums como número en pólizas y cuotas, y como string en otros endpoints | Mapeo frágil; errores de UI si el back cambia el orden | B2, B5, B9, B10, W3 | FB7.3, `convenciones §5` |
| R2 | Sin endpoint público de estado del pago | W6 no puede confirmar "pago aprobado" | W6, W4 | `pagos-facturas.md §12` D1 |
| R3 | Cupón público especificado, no implementado | W5 sin datos reales; W3 y W4 dependen | W3, W4, W5 | `polizas-cuotas-pagofacil.md §13` |
| R4 | `ClientesController` solo en PR #50 y listado, detalle, edición y baja especificados | Bloquea B3, B4, B5 y parte de B6, B7, B8, B9 | B3..B9 | `seguridad-clientes-publico.md §0` |
| R5 | Sin listado de pagos ni cuotas vencidas globales | B11 bloqueada; widget de B2 incompleto | B2, B10, B11 | `pagos-facturas.md`; `B2 §9` |
| R6 | Deuda del cliente para Empleado sin endpoint | Cuenta de B5 sin datos | B5 | `B5 D-B5-05` |
| R7 | `DateTime` a veces con `Z` y a veces sin `Z` | Horas mal mostradas | Varias | `convenciones §5.3`; `polizas §1.5` D5 |
| R8 | Errores de negocio sin `codigo` | Marcar campo exige leer texto | B4, B6, B7, B8, W2 | `convenciones §3.4`; `vehiculos D2` |
| R9 | Layouts de Pago Fácil son propuestas hasta tener el PDF | Código de barras y rendición pueden no ser válidos | W5, B12 | `polizas §6.3`, `§7.1`; `W5 D8` |
| R10 | Segundo importe del cupón con desborde por encima de ~95.237 | Cupón y base positiva fallan | W5, B12 | `polizas §6.3`, D7 |
| R11 | Renaper caído devuelve 201 | El front debe avisar y ofrecer reintento | B4, B5 | `clientes §3.1.1` |
| R12 | Login sin límite de intentos; token en `sessionStorage` | Fuerza bruta; robo de token por script | B1 | `seguridad §4 D4`; FB7.5 |
| R13 | Sin refresh ni logout en el servidor | Sesión de 480 min sin revocación | Todas | `convenciones §2.2` |
| R14 | Base positiva omite cuotas con DNI inválido sin avisar | Deuda que no se cobra | B12 | `polizas §8.1` D12 |
| R15 | Sin `Retry-After` en 429 y sin exponer headers por CORS | Espera fija; nombre de archivo calculado | W2, W5, B12 | `convenciones §4`, `§7.2` |
| R16 | Pagos abandonados quedan `PENDIENTE` sin job de vencimiento | Excedentes y revisión manual | W4, W6 | `pagos-facturas.md §12` D4 |
| R17 | Cuota con cupón suma recargo que el pago no suma | Importe distinto entre cupón y pago | W5, W4 | `polizas §6.4` D9 |

---

## 11. Contradicciones detectadas

Cada item indica documento y sección de cada lado. Cuando FB (`00-decisiones-base.md`) resuelve el punto, se indica; si no, queda abierto.

### 11.1 Figma ↔ back

1. **Precios "desde" de planes.** `pantallas/W1-inicio.md §3` y `§9`: RC `$ 10.000,00`, TC `$ 18.000,00`, TR `$ 27.500,00`. `contratos-api/vehiculos-planes-cotizaciones.md §3.1` (seed): RC `12000.00`, TC `18000.00`, TR `30000.00`. El Figma y el seed no coinciden. Abierto (W1 D2).
2. **Matriz de coberturas.** `W1 §9` y `W1 §13` D3: el Figma tiene filas de cobertura; el `PlanResponse` no tiene matriz. Abierto.
3. **Titular y DNI en W3, W5, B2, B5, B8, B10.** Figma muestra "Tomás Iturralde" y "DNI 30.123.456". `contratos-api/polizas-cuotas-pagofacil.md §6.3` y `seguridad §6.3`: `ConsultaPublicaResponse` no trae nombre ni ids de cliente (RN20). Abierto (W3 D1, W5 D5).
4. **Texto del error de login.** `B1 §5 y §7` y `D-1`: Figma "Email o contraseña incorrectos.". `contratos-api/seguridad-clientes-publico.md §2.6`: back devuelve `detail` "Credenciales inválidas.". FB7.6 dice que la UI muestra `detail`. Resuelto por FB7.6: mostrar "Credenciales inválidas.". El copy del Figma queda como pedido a diseño.
5. **Texto del 404 de consulta pública.** `W2 §7` y `§13` D1: Figma "No encontramos una póliza con esos datos…"; back "No se encontró un registro con los datos indicados.". FB7.6 dice que la UI muestra `detail`. Resuelto por FB7.6 para la consulta: mostrar `detail`. Abierto el copy final con diseño.
6. **Segundo vencimiento del cupón.** `W5 §5` y `D4`: Figma 17/11/2026 para el 1er vencimiento 10/11/2026; back `DiasAlSegundoVencimiento = 10` da 20/11/2026. Abierto (dato de negocio).
7. **Montos y fechas de muestra.** Múltiples pantallas (B5, B8, W6) muestran "PA-7741-2093" como número de operación; el back genera `PAG-xxxxxx`. Abierto (W6 D5).
8. **Vigencia en meses.** `W3 §9.1`: Figma "12 meses"; el DTO no lo trae. Abierto (propuesta de cálculo, W3 D2).
9. **Botones de la pantalla de pago.** `W3 §3.2` y `§13` D7: "Pagar seleccionadas" en desktop y "Pagar" en mobile. Abierto.
10. **Badge "Vencida" en color.** `design-system.md §5.4`: Vencida usa tokens de `status/vencida` (gris). `pantallas/W4 D10`, `pantallas/B2 D-10`, `pantallas/W3 §13` D3: el badge de cuota Vencida se dibuja con tokens de `status/cancelada` (rojo). Abierto.
11. **Iconos.** FB7.1 fija Phosphor. `pantallas/W4 §4`, `W5 §4`, `W6 §4`, `W2 §4`: "usar el SVG de Figma, no reemplazar por otra librería de iconos". Resuelto por FB7.1 (Phosphor como default); las pantallas deben confirmar qué íconos existen en Phosphor.
12. **Sidebar con ítems admin para Empleado.** `B1 D-3`, `B2 D-3`, `B5 D-B5-11`: el Figma muestra Planes y Usuarios a un Empleado. FB7.10: se ocultan. Resuelto por FB7.10.
13. **Alturas del Shell y frames.** `design-system.md §7.2` y `§9.9`: Sidebar 976; `pantallas/B5 §3`: Shell 960 y frame 1024; `B4 §3`: frame 1226 con Shell 1178; `W3m`: padding de 12 px (`pantallas/W3 §13` D17) vs 16 px de `design-system.md §7.4`. Abierto.
14. **Anchos de tabla.** `design-system.md §5.12` y `§9.3`: "columnas de igual ancho (layoutGrow)" vs anchos fijos (160/110/200/120/100/120/94/24). Mismo conflicto en `pantallas/B3 D-4` (210/116/226/124/104/130/146/40). Abierto.
15. **Tamaño de página.** `pantallas/B3 D-5`: el Figma muestra 10 filas; `contratos-api/seguridad`/`clientes §3.4` y spec US-F1-06: `tamanoPagina` por defecto 20. Abierto.
16. **Fuentes.** `design-system.md §2.1`: carga desde Google Fonts (CDN); FB7.2: `@fontsource/*` local, sin CDN. Resuelto por FB7.2.
17. **Pantalla de éxito de cliente.** `pantallas/B4 §7`: "Cliente guardado" (propuesta) vs PR #50 con 201. Abierto (copy).
18. **Enum en request y response.** `contratos-api/vehiculos §2.1` dice `uso` numérico; los comentarios XML del back dicen "Particular, Comercial" (`convenciones §9` D15). Abierto (decisión backend).

### 11.2 Pantalla ↔ pantalla

19. **Ruta de inicio.** `pantallas/B1 §2` y `B2 §2`: `/inicio`. `pantallas/B11 §8` (sidebar "Inicio `/`"). Conflicto. Propuesta: `/inicio`; corregir B11.
20. **Ruta de Pago Fácil.** `pantallas/B12 §2`: `/pago-facil`. `pantallas/B2 §8`: `/pago-facil/rendiciones` y `/pago-facil/base-positiva`. Conflicto. Abierto.
21. **Ruta de cupón público.** `pantallas/W1 §8`, `W4 §2`, `W5 §2`: `/poliza/pagar/pago-facil`. Coincidente; `W3 §13`: la ruta de W3 sigue como propuesta. Sin conflicto de destino.
22. **Ruta de W2.** `pantallas/W2 §2`: `/consultar-poliza`. `pantallas/W4 §2`: "Ruta de W2 NO DEFINIDA". Mismo destino, distinto estado. Resuelto por el mapa de rutas de esta sección 2.2.
23. **Origen de la cotización.** `pantallas/B5 §8`: "Nueva cotización" lleva a `/cotizaciones/nueva` sin vehículo. `pantallas/B7 §2`: `vehiculoId` obligatorio. Abierto (B5 D-B5-09).
24. **Cupón público: parámetro de cuota.** `pantallas/W3 §9.3`: el body de `POST /api/publico/cupon` es `CuponPublicoRequest(Dni, NumeroPoliza, NumeroCuota)`. `pantallas/W5 §6`: `cuotaId`. `AnalisisBack §7`: "cuota". Abierto.
25. **Cuántos cupones por pago.** `pantallas/W3 D5`: (b) un cupón por cuota. `pantallas/W4 D1` y `W5 D1`: bloqueante, sin decidir. Abierto.
26. **Pagos ↔ cuota en `W6`.** `pantallas/W6 §9.1` dice que la cuota se marca "Pagada" cuando el webhook procesó el pago. `W4 §9.3`: el webhook no es del front. Consistente, pero W6 depende de R2.
27. **Colisión de rutas.** `/clientes/nuevo` (B4) vs `/clientes/:clienteId` (B5). `/polizas/nueva` (B8) vs `/polizas/:id` (B10). Riesgo de router, no de Figma.

### 11.3 Contrato ↔ contrato

28. **Fechas `DateTime`.** `contratos-api/pagos-facturas.md §2.1`: `fechaCreacion`, `fechaAcreditacion`, `fechaEmision` siempre con `Z`. `convenciones §5.3` y `polizas §1.5`: los valores leídos de la base llegan sin `Z`. Abierto (verificar con SQL Server, D5 de polizas).
29. **Enums públicos.** FB7.3 limita el string a `PagoResponse` y `FacturaResponse`. `convenciones §5.2` y `pagos-facturas §3`: también la consulta pública y `DeudaExterna` mandan strings. Corregido en esta sección 6.2 (FB no lo dice).
30. **Cupón público: US de origen.** `polizas-cuotas-pagofacil.md §13`: "depende de US-F1-07". `W3 §9.3`, `W4 §9`, `W5 §6`: US-F3-06 (`tareas-divididas.md`). Abierto.
31. **Login: nombres de propiedad.** `pantallas/B14 §9`: `LoginResponse` con `Token`, `Rol`, `ExpiraEn` (PascalCase). `contratos-api/seguridad §2.6`: camelCase. Abierto (verificar con respuesta real; el contrato indica camelCase por default).
32. **Crear usuario: campos de respuesta.** `pantallas/B14 §9`: `UsuarioResponse` con `Id`, `Email`, `Rol` (PascalCase, mismo tema). `contratos-api/seguridad §2.5`: `id`, `email`, `rol`. Mismo punto que 31.
33. **Alta de vehículo: origen.** `pantallas/B6 §9`: "US-F2-04 en development". `contratos-api/vehiculos §2.1`: "PR #24". Abierto (dato de trazabilidad, sin efecto técnico).
34. **Convenciones referenciadas.** FB4 y `pagos-facturas.md §2` y §12 D11 dicen que `contratos-api/convenciones-transversales.md` no existe. Ya existe. Documento desactualizado; corregir en `pagos-facturas.md`.
35. **Estado de cuotas.** `polizas §3.3`: el recargo se aplica al vencer; `pantallas/B2 §10`: "el estado Vencida se calcula con el job diario". Consistentes; la consulta muestra el valor guardado (`seguridad §6.4`, D10). Abierto por el desfase (job de 00:05).
36. **Límite de cuotas.** `pantallas/W4 §6` y `W3 §6`: máximo 24 cuotas por pago online. `contratos-api/pagos-facturas §3` (`PagoPublicoRequest.cuotaIds` 1..24). Coincidente. Pero `pagos §8`: caja sin máximo. Sin conflicto.

---

## 12. Orden recomendado de construcción (oleadas)

Insumo para dividir en tareas. No se definen tareas aquí (FB5 y encargo).

### Oleada 0: base (día 1, en paralelo)

- `@nexa/config`: tsconfig, ESLint, preset de Tailwind.
- `@nexa/ui`: `tokens.css`, `Button`, `Input`, `Select`, `Badge/Estado`, `Chip`, `Table`, `CardWidget`, `Logo/Nexa`.
- `@nexa/api`: cliente HTTP, lectura de `ProblemDetails`, formateadores, mapas de enums, tipos DTO.
- `packages/api/mocks`: MSW con handlers de los endpoints Implementados y de los que aún no existen.
- Scaffolding de las dos apps: router, providers, guardas por rol.

### Oleada 1: pantallas con endpoints implementados (paralelo, sin dependencias entre sí)

- Backoffice: B1 (login), B2 (parcial, con mocks para widgets sin endpoint), B6 (depende de B5 solo para el contexto del cliente, que va con mock), B9, B10 (parcial: lista de pagos mock), B13 (depende solo de `planes`), B14 (solo alta).
- Web pública: W1 (depende de `planes`), W2 (consulta), W3 (depende de W2 por `location.state`), W4 (depende de W3), W6 (depende de W4 por `numeroPago`).

Dependencias internas de la oleada: W3 → W2; W4 → W3; W6 → W4; B8 → B7 (`cotizacionId`); B6 → cliente (mock); B10 → B8 (ver detalle de póliza).

### Oleada 2: dependen de PRs o especificaciones

- B4 y las acciones de B3/B5 de Renaper: esperan el merge de PR #50.
- B3, B5 y la parte de clientes de B7, B8, B9: esperan el listado y el detalle de clientes (US-F1-06).
- B11: espera el listado de pagos (`GET /api/pagos`), que no está especificado.
- W5: espera `POST /api/publico/cupon` (especificado).
- B12 (tabla de bases) y B2 (widgets sin endpoint): esperan decisiones y endpoints nuevos.

### Oleada 3: cierre

- Pasar de mock a real endpoint por endpoint (sección 7.4) y revisar tipos.
- Accesibilidad y contraste (sección 9): los pedidos a diseño deben cerrarse antes.
- Los tests de contrato por endpoint al publicar cada PR del back.

### Orden de dependencias (resumen)

```
Oleada 0 (@nexa/config, @nexa/ui, @nexa/api, mocks, scaffolding)
 ├─ B1, W1, W2 (sin dependencias de pantalla)
 ├─ W3 ← W2 ← W4 ← W6
 ├─ B7 ← B5/B9 (acceso) ← B8 ← B10
 ├─ B6, B13, B14 (independientes)
 └─ Oleada 2: B3, B4, B5 (PR #50 y US-F1-06), B11 (listado), W5 (cupón público), B12 (tabla de bases)
```

Prerrequisitos de diseño antes de construir: W1 precios y matriz; B2 nombre del usuario; B5 "Cuenta"; B12 layout de Pago Fácil; W3 titular.

---

## 13. Glosario

| Término | Significado en el dominio |
|---|---|
| **ARCA** | Agencia de Recaudación y Control Aduanero. Emite la factura electrónica (CAE). Frente 4 (`pagos-facturas.md §7`). Expansión de general conocimiento; no aparece en los documentos. |
| **Base positiva** | Archivo de deudas vigentes que se entrega a Pago Fácil (`pantallas/B12 §1`; `polizas §8`). |
| **CAE** | Código de Autorización Electrónico de la factura. 14 dígitos (`pagos-facturas.md §7.1`). Expansión de general conocimiento. |
| **CU01..CU22** | Casos de uso de `docs/AnalisisBack.md` §3 (ej.: CU01 login, CU02 consulta pública, CU04 alta de cliente, CU10 emisión, CU20 cupón, CU21 rendición, CU22 base positiva). |
| **C8** | Regla de tareas: reserva de cuotas durante `ReservaMinutos` (60 min) para pago online (`pagos-facturas.md §5`). |
| **Cobertura vigente** | Solo la póliza `Vigente` da cobertura (RN10). |
| **Cuota** | Pago mensual de una póliza. Estados: Pendiente, Vencida, Pagada, Anulada. |
| **DNI** | Documento Nacional de Identidad. Regex `^\d{8}$`. |
| **DNRPA** | Registro de vehículos. Valida la patente y el titular (RN03). |
| **Figma** | Diseño de referencia. Archivo `nkiHNA713jSg1zgdz9WIWn`, páginas `00 Fundamentos`, `01 Web publica`, `02 Backoffice`. |
| **F1..F4** | Frentes del back: F1 clientes y auth, F2 vehículos y cotizaciones, F3 pólizas y Pago Fácil, F4 pagos y facturas. |
| **Pago Fácil** | Red de pago en efectivo. Cupón de 42 dígitos, rendición de archivo y base positiva. |
| **Pasarela** | Proveedor de pago online. `pasarela1` y `pasarela2` (nombres técnicos; los comerciales son NO DEFINIDO). |
| **Póliza** | Contrato de seguro. Número `POL-0000000`. Estados: Pendiente, Vigente, Suspendida, Cancelada, Vencida. |
| **Prima** | Importe mensual de la póliza, calculado con factores (RN06). |
| **Renaper** | Registro Nacional de las Personas. Valida el DNI y devuelve datos y estado (VIGENTE / FALLECIDO) (RN02). |
| **RN01..RN20** | Reglas de negocio de `docs/AnalisisBack.md` §4. Las visibles en el front: RN01 (unicidad y mayoría de edad), RN02 (validación Renaper), RN03 (DNRPA y titular), RN04 (una póliza activa por vehículo), RN05 (planes compatibles), RN06 (fórmula de prima), RN07 (cuotas), RN08 (recargo 5%), RN09 (suspendida), RN10 (cobertura), RN11 (cuotas pagables), RN13 (cancelación), RN14 (vencimiento), RN15 (baja lógica), RN16 (UTC), RN17 (roles), RN18 (formato de cupón y rendición), RN19 (cancelación automática), RN20 (rate limit y consulta pública). |
| **Rendición** | Archivo diario de Pago Fácil con líneas de cobro (60 caracteres por línea). |
| **RowVersion** | Control de concurrencia de cuotas y pagos (`pagos-facturas.md §6.3`). |
| **Shell** | Contenedor blanco flotante de las pantallas (`design-system.md §5.15`). |
| **Vigencia** | 1, 6 o 12 meses (RN07). Cotización válida 15 días (RN06). |

---

## 14. Referencias

- Decisiones base: `docs/frontend/00-decisiones-base.md`.
- Pedidos al back: `docs/frontend/pedidos-al-back.md` (en paralelo).
- Diseño: `docs/frontend/design-system.md`.
- Contratos: `docs/frontend/contratos-api/` (convenciones, seguridad y clientes, vehículos y cotizaciones, pólizas y Pago Fácil, pagos y facturas).
- Pantallas: `docs/frontend/pantallas/` (W1..W6, B1..B14).
