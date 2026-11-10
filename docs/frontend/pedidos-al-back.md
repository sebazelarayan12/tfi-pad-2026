# Pedidos al back (huecos detectados por el frontend)

Consolidado de huecos, bugs e inconsistencias que el front encontró en las pantallas (`pantallas/*.md`) y los contratos (`contratos-api/*.md`). Cada ítem fue verificado contra `backend/Aseguradora.Api/Controllers` y `backend/Aseguradora.Application` antes de listarlo. Rutas relativas a la raíz del repo. Verificación original sobre `development` en `4ba3d4b`. PB-03 se revisó nuevamente el 2026-11-04 contra `8e7df6f`; los demás pedidos conservan su fecha/base original salvo indicación propia.

Leyenda de severidad: **Bloquea** = la pantalla no se puede construir de forma confiable; **Degrada** = se construye con un workaround visible; **Mejora** = no bloquea.

Leyenda de estado: **Falta endpoint**, **Bug**, **Inconsistencia de contrato**, **Mejora**.

Convención de workaround: MSW (`frontend/packages/api/mocks`, `VITE_USE_MOCKS=true`) cuando el endpoint no existe; campo opcional con estado "no disponible" cuando el dato no llega en una respuesta existente (FB7 de `00-decisiones-base.md`).

---

## Índice

| ID | Título | Tipo | Severidad | Pantallas afectadas | Estado |
|----|--------|------|-----------|---------------------|--------|
| PB-01 | Estado público del pago y recuperación por número de pago | Falta endpoint | Bloquea | W4, W6 | Falta endpoint |
| PB-02 | Cupón público de Pago Fácil `POST /api/publico/cupon` | Falta endpoint | Bloquea | W3, W4, W5 | Falta endpoint |
| PB-03 | Resumen de clientes: faltan Renaper y conteos | Inconsistencia de contrato | Degrada | B3 (B-04) | Resuelto: el resumen trae `validadoRenaper`, `cantidadVehiculos` y `cantidadPolizasActivas` |
| PB-04 | Usuarios: listado, edición, activar/desactivar, último ingreso, nombre | Falta endpoint | Bloquea | B14, B1, B2 | Falta endpoint |
| PB-05 | Búsqueda y listados de pagos (por póliza, por cuota, por número de póliza) | Resuelto en el back: `GET /api/pagos` y `GET /api/polizas/{id}/pagos` | Bloquea | B10, B11, B9, B8 | Resuelto |
| PB-06 | Filtros de `GET /api/polizas`: plan, número de póliza, DNI | Falta endpoint | Bloquea | B9 | Falta endpoint |
| PB-07 | Titular y DNI en la consulta pública | Falta endpoint | Degrada | W3, W5 | Falta endpoint |
| PB-08 | Resumen de inicio (conteos, cuotas vencidas, tareas, fecha de corte) | Falta endpoint | Bloquea | B2 | Falta endpoint |
| PB-09 | Planes inactivos: ver y reactivar | Falta endpoint | Degrada | B13 | Falta endpoint |
| PB-10 | Desglose de factores y prima base en la cotización | Falta endpoint | Bloquea | B7, B5 | Falta endpoint |
| PB-11 | PDF de factura (`UrlPdf` no mapeado) | Falta endpoint | Degrada | W6, B11 | Falta endpoint |
| PB-12 | `Idempotency-Key` en pagos y cotizaciones | Mejora | Degrada | W4, B7, B10, B12 | Mejora |
| PB-13 | Enums: converter global y uniformidad (número vs texto) | Inconsistencia de contrato | Degrada | Todas las de pólizas, cuotas, vehículos | Inconsistencia de contrato |
| PB-14 | Códigos estables en los 400 de negocio | Inconsistencia de contrato | Degrada | B4, B6, B8, W4 | Inconsistencia de contrato |
| PB-15 | Mensajes de validación en inglés (ASP.NET por defecto) | Bug | Degrada | B1, B4, B14, W2 | Bug |
| PB-16 | `DateTime` sin sufijo `Z` según el endpoint | Inconsistencia de contrato | Degrada | B9, B10, W6, B11 | Inconsistencia de contrato |
| PB-17 | `Retry-After` en 429 y `Content-Disposition` no expuesto por CORS | Mejora | Degrada | W2, W3, B12 | Mejora |
| PB-18 | Desborde del cupón y de la base positiva con cuotas mayores a ~$95.237 | Bug | Degrada | B12, W5, B10 | Bug |
| PB-19 | Rendición: 201 con líneas rechazadas y resultado no persistido | Inconsistencia de contrato | Degrada | B12 | Inconsistencia de contrato |
| PB-20 | Fecha de vencimiento de la cuota 1 (Figma 10/11 vs código 10/12) | Inconsistencia de contrato | Bloquea | B8, B10 | Inconsistencia de contrato |
| PB-21 | Segundo vencimiento del cupón: 17/11 (Figma) vs 20/11 (back) | Inconsistencia de contrato | Bloquea | W5, W4 | Inconsistencia de contrato |
| PB-22 | Medios de pago: `pasarela1`/`pasarela2` sin nombre comercial | Inconsistencia de contrato | Bloquea | W4, W6 | Inconsistencia de contrato |
| PB-23 | Vista previa DNRPA por patente antes de guardar | Falta endpoint | Bloquea | B6 | Falta endpoint |
| PB-24 | Listado global de cuotas por estado (cuotas vencidas) | Falta endpoint | Bloquea | B2, B5 | Falta endpoint |
| PB-25 | Cobro en caja sin forma de pago (efectivo u otro) | Mejora | Mejora | B10, B11 | Mejora |
| PB-26 | `POST /api/cotizaciones` no es idempotente y no hay listado de cotizaciones | Inconsistencia de contrato | Degrada | B7, B5 | Inconsistencia de contrato |
| PB-27 | Datos de cancelación, emisor, historial de estados y cliente en el detalle de póliza | Falta endpoint | Degrada | B10, B8 | Falta endpoint |
| PB-28 | Deuda consolidada del cliente para un Empleado (JWT) | Falta endpoint | Bloquea | B5 | Falta endpoint |
| PB-29 | Validación de CUIL, DNI de 7 dígitos y límites de rate limit | Mejora | Mejora | B4, W2 | Mejora |
| PB-30 | Póliza `Vencida` o `Cancelada` con cuotas impagas: cupón y cobro | Inconsistencia de contrato | Degrada | B10, B9 | Inconsistencia de contrato |
| PB-31 | Cambio obligatorio de contraseña en el primer ingreso y política de contraseña fuerte | Falta endpoint | Degrada | B1, B14 (B-24, B-26) | Falta endpoint |

---

## Fichas

### PB-01. Estado público del pago y recuperación por número de pago

- **Qué pasa hoy.** `Controllers/PublicoPagosController.cs` solo expone `POST /api/publico/factura` (línea 14) y `POST /api/publico/pagos` (línea 23). No hay ningún endpoint público que devuelva `PENDIENTE` / `APROBADO` / `RECHAZADO`. `GET /api/pagos/{id}` (`PagosController.cs:38`) requiere `Politicas.Empleado`. `POST /api/publico/factura` devuelve 404 tanto si el pago está pendiente como si fue rechazado (`contratos-api/pagos-facturas.md` §5 paso 6). La URL de retorno (`Pagos:UrlRetornoExito`, `PagoOnlineOpciones.cs:19`) es fija y no lleva `numeroPago`. Tampoco hay forma de recuperar el `urlPago` de un pago ya creado (si se pierde el 201 de `POST /api/publico/pagos`, las cuotas quedan reservadas `ReservaMinutos`).
- **Qué necesita el front y por qué.** W6 ("Pago aprobado") debe mostrar el estado real del pago sin depender del webhook asíncrono. W4 necesita poder recuperar un pago en curso. Sin esto, un pago rechazado y uno pendiente se ven igual.
- **Contrato mínimo propuesto.**
  ```ts
  // POST /api/publico/pagos/estado   (anónimo, cuenta para RN20; sin DNI, RV-D17 / FB8)
  interface ConsultaEstadoPagoRequest { numeroPago: string; /* PAG-xxxxxx */ }
  interface EstadoPagoPublicoResponse {
    numeroPago: string;
    estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';   // ValoresPagoResponse
    fechaAcreditacion: string | null;                  // ISO UTC con Z
    urlPago: string | null;                            // solo si estado = PENDIENTE y no expiró
    factura: FacturaResponse | null;
  }
  // 404 genérico (mismo mensaje que el resto de /api/publico) si el número no corresponde.
  ```
  Además, para la URL de retorno: que la pasarela o la configuración agreguen `numeroPago` (decisión de back).
  Mismo criterio para `POST /api/publico/factura`, que hoy exige `dni` (RV-D17). **[CONFIRMAR]** seguridad antes de W-06: con este diseño el número de pago sin DNI es la única credencial de consulta.
- **Pantallas que desbloquea.** W4 (recuperar pago en curso), W6 (estado real), W3 (volver a la póliza).
- **Severidad.** Bloquea.
- **Workaround front.** MSW para W6 y W4. Sin el endpoint, W6 solo puede mostrar "Pago aprobado" si `POST /api/publico/factura` devuelve 200 (polling limitado a 10/min). Se guarda `numeroPago` en `sessionStorage` antes de redirigir (no el DNI).

### PB-02. Cupón público de Pago Fácil

- **Qué pasa hoy.** `POST /api/publico/cupon` no existe: `Controllers/` no tiene ningún controlador con esa ruta (lista de `[Route]` en `Controllers/`: `PublicoController` solo define `consulta`, `pagos`, `factura` en sus hijos). El único cupón expuesto es `GET /api/pagofacil/cuotas/{cuotaId}/cupon` (`PagoFacilController.cs:26`), con `[Authorize(Policy = Politicas.Empleado)]`, inutilizable desde la web pública. `docs/AnalisisBack.md` §7 y US-F3-06 lo especifican; no hay PR abierta que lo agregue.
- **Qué necesita el front.** W5 debe mostrar el cupón real de una cuota elegida por el cliente, con DNI + póliza + número de cuota (no `idCuota`), sin login.
- **Contrato mínimo propuesto.**
  ```ts
  // POST /api/publico/cupon  (anónimo, RN20)
  interface CuponPublicoRequest { dni: string; /* ^\d{8}$ */ numeroPoliza: string; /* ^POL-\d{7}$ */ numeroCuota: number; }
  // 200: CuponPagoFacilResponse (contratos-api/polizas-cuotas-pagofacil.md §6.1)
  // 404 genérico si DNI/póliza no coinciden o la cuota no pertenece a la póliza.
  // 400 si la cuota está Pagada o Anulada (RN11).
  ```
  Decisión asociada: que el DTO incluya `totalCuotas` (W5 muestra "9 de 12"; hoy no hay dato, `CuponPagoFacilResponse` solo tiene `numeroCuota`).
- **Pantallas que desbloquea.** W5 (completa), W3 (botón "Descargar cupón"), W4 (opción Pago Fácil).
- **Severidad.** Bloquea.
- **Workaround front.** MSW con el contrato de arriba. No usar el `GET` de empleado.

### PB-03. Clientes: endpoints publicados; ampliación del resumen pendiente

- **Revisión 2026-11-04:** US-F1-06 se mergeó en PR #58 (`6356111`). Ya existen listado, detalle, modificación y baja lógica en `ClientesController.cs`. No se mantiene un bloqueo por ausencia de esos endpoints.
- **Contrato real:** `GET /api/clientes` devuelve `PaginaResponse<ClienteResumenResponse>`, con filtros DNI exacto y apellido parcial sin distinguir mayúsculas, y query `pagina`/`tamanoPagina`. El resumen contiene únicamente `id`, `dni`, `nombre`, `apellido`, `email`, `telefono` y `activo`. GET detalle y PUT devuelven `ClienteResponse`; DELETE devuelve 204 y bloquea con 400 si hay póliza Pendiente, Vigente o Suspendida.
- **Resuelto (2026-11-10):** el resumen ya incluye `validadoRenaper`, `cantidadVehiculos` (solo vehículos activos) y `cantidadPolizasActivas` (Pendiente, Vigente y Suspendida, definición elegida por el usuario). Lo siguiente describe el estado previo: B3 necesitaba además `validadoRenaper`, `cantidadVehiculos` y `cantidadPolizasActivas`. Se solicita evaluar su incorporación a `ClienteResumenResponse`; no se declara acordada ni implementada esa ampliación. La definición de los conteos debe confirmarse con el backend antes de incorporarlos al wire.
- **Fuentes:** `backend/Aseguradora.Application/Clientes/DTOs/ClienteResumenResponse.cs`, `ClienteFiltro.cs`, `ClienteResponse.cs`, `ClienteModificacionRequest.cs` y `ClienteService.cs`.
- **Severidad actual:** degrada B3, no bloquea consumir el listado/detalle/PUT/DELETE. El nombre/DNI y el estado Renaper del detalle ya están disponibles para B5 y las otras features consumidoras.
- **Workaround:** T-24 tipa y mockea el resumen con sus siete campos reales. B3 mantiene las columnas afectadas con `—` como dato no disponible (FB7.11), sin fabricar cero, false o badges Pendiente, ni hacer un request de detalle por fila para simular el campo. En B5 se usa `validadoRenaper` del detalle, que sí existe. `/cuenta` corresponde a PB-28 y continúa pendiente.

### PB-04. Usuarios: listado, edición, estado y último ingreso

- **Qué pasa hoy.** `Controllers/AuthController.cs` define solo `POST /api/auth/login` (línea 21) y `POST /api/auth/usuarios` (línea 29, `Politicas.Admin`). No hay `GET /api/usuarios`, ni `PUT`, ni `PATCH` de activación, ni campo de último ingreso. El login (`LoginResponse`) no devuelve nombre ni apellido, y el JWT (`JwtTokenService.cs:30-36`) tiene `sub`, `email` y `role` (confirmado por `contratos-api/seguridad-clientes-publico.md` §2.1). `CrearUsuarioRequest` sí recibe `nombre` y `apellido`, pero `UsuarioResponse` (`UsuarioResponse.cs:7`) solo devuelve `id`, `email` y `rol`.
- **Qué necesita el front.** B14 necesita listado, edición, activar/desactivar y último ingreso. B1/B2 necesitan nombre y apellido para el saludo, el avatar y el sidebar.
- **Contrato mínimo propuesto.**
  ```ts
  // GET /api/auth/yo  (Politicas.Empleado) -> { id: string; email: string; nombre: string; apellido: string; rol: RolUsuario }
  // GET /api/usuarios?pagina=&tamano=  (Politicas.Admin) -> PaginaResponse<UsuarioListItem>
  interface UsuarioListItem { id: string; email: string; nombre: string; apellido: string; rol: RolUsuario; activo: boolean; ultimoIngreso: string | null; }
  // PUT /api/usuarios/{id}  { nombre, apellido, rol }  -> 200 UsuarioListItem
  // PATCH /api/usuarios/{id}/activo  { activo: boolean } -> 200 UsuarioListItem
  // Decisión FB8 (RV-D30): PATCH de activación y `tamano` (no `tamanoPagina`); B14 §9 alineado.
  ```
  Alternativa de menor costo para el nombre: agregar `nombre` y `apellido` como claims del JWT (`JwtTokenService.cs`).
- **Pantallas que desbloquea.** B14 (completa), B1 (nombre en login), B2 (saludo y avatar).
- **Severidad.** Bloquea (B14), Degrada (B1, B2).
- **Workaround front.** B2 muestra el email del claim `email` y omite el nombre. B14 se reduce a alta (ver PB-04 Dudas del propio B14, punto 1).

### PB-05. Pagos: listado por póliza, por cuota y búsqueda por número

> **Resuelto.** El back publica `GET /api/pagos?estado=&medio=&numeroPoliza=&pagina=&tamano=` (`PaginaResponse<PagoListadoResponse>`, del más nuevo al más viejo, sin filtro por fechas) y `GET /api/polizas/{id}/pagos` (`PagoResponse[]` con factura; 404 si la póliza no existe). Estado y medio van en mayúsculas (`PENDIENTE`, `APROBADO`, `RECHAZADO`; `CAJA`, `PASARELA`, `PAGO_FACIL`) y un valor desconocido da 400. El front los consume sin mock; MSW solo los responde con `VITE_USE_MOCKS=true`. Lo que sigue describe el pedido original.

- **Qué pasa hoy.** `Controllers/PagosController.cs` define `POST /api/pagos/caja` (línea 28), `GET /api/pagos/{id}` (38), `GET /api/pagos/{id}/factura` (44) y `POST /api/pagos/{id}/conciliar` (19). No hay `GET /api/pagos` (listado) ni `GET /api/polizas/{id}/pagos`. `CuotaResponse` (`Dtos/Polizas/CuotaResponse.cs:15-22`) no trae `pagoId`. `PolizaDetalleResponse` no trae pagos. Por eso un pago de caja que se perdió (corte de red tras el 201) no se puede recuperar buscando por cuota o póliza (`contratos-api/pagos-facturas.md` §9.3).
- **Qué necesita el front.** B10 (widget de pagos), B11 (tabla de pagos y facturas), B9 (acciones por fila), y la recuperación de caja tras corte de red.
- **Contrato mínimo propuesto.**
  ```ts
  // GET /api/polizas/{id}/pagos  (Politicas.Empleado) -> PagoResponse[]   (incluye factura; RV-D13 / FB8)
  // GET /api/pagos?desde=&hasta=&medio=&estado=&numeroPoliza=&pagina=&tamano=  -> PaginaResponse<PagoListadoResponse>   (forma de pantallas/B11-pagos-y-facturas.md §9)
  // Alternativa mínima: agregar pagoId: string | null a CuotaResponse.
  ```
- **Pantallas que desbloquea.** B10 (crítica), B11 (tabla completa, decisión de la pantalla), B9 (filtro por número).
- **Severidad.** Bloquea.
- **Workaround front.** B11 se publica sin tabla de listado (solo detalle por id). B10 muestra cuotas con `fechaPago` y sin enlace a pago.

### PB-06. Filtros de `GET /api/polizas`

- **Qué pasa hoy.** `Dtos/Polizas/PolizaFiltro.cs:15-25` solo tiene `Estado`, `ClienteId`, `Patente`, `Pagina` y `Tamano`. No hay filtro por número de póliza, DNI del titular ni código de plan. `PolizaService.cs:94-97` hace match exacto de patente (no parcial).
- **Qué necesita el front.** B9 busca por "número, DNI o patente", filtra por plan y necesita búsqueda parcial de patente (B9 D2, D3, D18 de `contratos-api/polizas-cuotas-pagofacil.md`).
- **Contrato mínimo propuesto.**
  ```ts
  // GET /api/polizas?numero=&dni=&planCodigo=&patente=&estado=&clienteId=&pagina=&tamano=
  // numero: coincidencia parcial ^POL-?\d*; dni: resuelto por el back contra Cliente.Dni (no requiere GET /api/clientes);
  // planCodigo: exacto ("RC" | "TC" | "TR"); patente: parcial opcional (decisión).
  ```
- **Pantallas que desbloquea.** B9 (búsqueda y filtro por plan).
- **Severidad.** Bloquea.
- **Workaround front.** El select de plan se oculta. La búsqueda se hace solo por estado y patente exacta. El buscador de DNI requiere PB-03.

### PB-07. Titular y DNI en la consulta pública

- **Qué pasa hoy.** `Application/Publico/DTOs/ConsultaPublicaResponse.cs` declara en su comentario de clase que no devuelve entidades ni ids de cliente, póliza, vehículo o plan, ni nombre del titular (líneas 4-6). W3 muestra "Titular: Tomás Iturralde" y "DNI 30.123.456" (`pantallas/W3-mi-poliza.md` §13 punto 1). W5 también (D5).
- **Qué necesita el front.** Mostrar el titular en W3 y W5. Es un dato de identificación que el cliente ya escribió (DNI), y el nombre sería el único dato nuevo.
- **Contrato mínimo propuesto.**
  ```ts
  // Agregar a ConsultaPublicaResponse:
  titular: { nombreCompleto: string; dniEnmascarado: string /* p. ej. "***.456" */ } | null;
  ```
  Requiere decisión de privacidad (RN20). Si no se aprueba, se quita del diseño.
- **Pantallas que desbloquea.** W3 (cabecera), W5 (datos de pago).
- **Severidad.** Degrada.
- **Workaround front.** Se omite el bloque "Titular". No se inventa el nombre.

### PB-08. Resumen de inicio para B2

- **Qué pasa hoy.** No existe `GET /api/inicio/resumen` ni equivalente. Los conteos de pólizas por estado se obtienen con seis llamadas a `GET /api/polizas?estado=X&tamano=1` (hay endpoints para eso), pero no hay un total de cuotas vencidas, no hay tareas del día, no hay fecha de corte del servidor y no hay "promo de rendición pendiente" (`pantallas/B2-inicio.md` §9, D-8).
- **Qué necesita el front.** B2 en una sola llamada, con fecha de corte del servidor.
- **Contrato mínimo propuesto.**
  ```ts
  // GET /api/inicio/resumen  (Politicas.Empleado)
  interface ResumenInicioResponse {
    fechaCorte: string;                         // "yyyy-MM-dd", día de Argentina
    polizasPorEstado: Record<'Pendiente'|'Vigente'|'Suspendida'|'Cancelada'|'Vencida', number>;
    cuotasVencidas: { total: number; recargoPorcentaje: number /* 5 */; recientes: CuotaVencidaResumen[] };
    rendicionPendienteHoy: boolean;
    facturasPendientesCae: number;
  }
  interface CuotaVencidaResumen { cuotaId: string; polizaId: string; numeroPoliza: string; clienteNombre: string; clienteApellido: string; numeroCuota: number; fechaVencimiento: string; importe: number; recargo: number; estado: 'Vencida'; }
  ```
  Las tareas del día quedan fuera de este pedido (no están en la spec; ver B2 D-11).

- **Nota de consumo (FB8, RV-D16 y RV-36).** Hasta que el back publique este endpoint, la request, su tipo y su hook viven en `features/inicio/` del front (excepción documentada a FC2). El KPI de cuotas vencidas y el donut de B2 son de B-02 y se alimentan de `GET /api/cuotas` (PB-24), no de este resumen.
- **Pantallas que desbloquea.** B2 completa.
- **Severidad.** Bloquea.
- **Workaround front.** Se combinan las llamadas existentes de `GET /api/polizas` y la sección de cuotas vencidas queda oculta.

### PB-09. Planes inactivos: ver y reactivar

- **Qué pasa hoy.** `Controllers/PlanesController.cs:20` (`GET /api/planes`) lista solo activos (`PlanService.cs:20-24`). `GET /api/planes/{id}` devuelve 404 si el plan está inactivo (`PlanService.cs:33-34`). `Dtos/PlanRequest.cs:13-34` no tiene campo `activo`, así que el PUT no puede reactivar (el PUT de un plan inactivo responde 200 y lo deja inactivo, `PlanService.cs:69-93`). No existe endpoint de reactivación (`PlanesController.cs` tiene GET, POST, PUT y DELETE solamente).
- **Qué necesita el front.** B13 debe mostrar planes inactivos y reactivarlos (Admin).
- **Contrato mínimo propuesto.**
  ```ts
  // GET /api/planes?incluirInactivos=true   (Politicas.Admin cuando incluirInactivos=true)
  // PATCH /api/planes/{id}/activo  { activo: boolean }  -> 200 PlanResponse   (Politicas.Admin)
  ```
- **Pantallas que desbloquea.** B13 (filtro de inactivos y reactivar).
- **Severidad.** Degrada.
- **Workaround front.** B13 muestra solo activos y el botón de reactivar queda oculto.

### PB-10. Desglose de factores y prima base en la cotización

- **Qué pasa hoy.** `Dtos/CotizacionResultado.cs:19` (`OpcionCotizacion`) devuelve `idCotizacion`, `codigoPlan`, `plan` y `primaMensual`. `CotizacionDto` no trae `primaBase` ni factores (tipo, antigüedad, edad, uso). Los factores existen en `Application/Services/CalculoPrima.cs:42-59`, pero no salen en la respuesta.
- **Qué necesita el front.** B7 muestra la línea de cálculo (`10.000,00 × 1,00 × 1,10 × 1,00 × 1,00`) y los factores junto a cada dato del widget. Es una pantalla de explicación de la prima.
- **Contrato mínimo propuesto.**
  ```ts
  interface OpcionCotizacion {
    idCotizacion: string; codigoPlan: string; plan: string; primaMensual: number;
    calculo: { primaBase: number; factorTipo: number; factorAntiguedad: number; factorEdad: number; factorUso: number; };
  }
  ```
- **Pantallas que desbloquea.** B7 (línea de cálculo y widget), B5 (factores del vehículo si se muestran).
- **Severidad.** Bloquea (la línea de cálculo es parte del diseño).
- **Workaround front.** Se omite la línea de cálculo. Se muestra solo `primaMensual`.

### PB-11. PDF de factura

- **Qué pasa hoy.** `Application/Dtos/ArcaDtos.cs:32` define `UrlPdf` y `Integrations/Arca/ArcaHttpService.cs:83` lo lee. `FacturaResponse` (`Application/Dtos/FacturaResponse.cs:4`) no lo incluye, y no hay endpoint de descarga. Por eso W6 ("Descargar comprobante") y B11 no tienen de dónde sacar el archivo.
- **Qué necesita el front.** Un enlace o descarga del comprobante.
- **Contrato mínimo propuesto.**
  ```ts
  // Agregar a FacturaResponse:
  urlPdf: string | null;        // null mientras estado = PENDIENTE_CAE
  // o bien GET /api/pagos/{id}/factura/pdf  -> application/pdf (Politicas.Empleado) y, para público, POST /api/publico/factura/pdf (RN20)
  ```
- **Pantallas que desbloquea.** W6 (descargar comprobante), B11 (descarga).
- **Severidad.** Degrada.
- **Workaround front.** Se quita el botón de descarga (decisión de diseño pendiente, W6 D6).

### PB-12. `Idempotency-Key` en pagos y cotizaciones

- **Qué pasa hoy.** Búsqueda en `backend/` (excluyendo tests): no hay `Idempotency-Key` en ningún controlador ni servicio. `POST /api/cotizaciones` persiste una cotización por plan en cada llamada (`Application/Services/CotizacionService.cs:98`). `POST /api/pagos/caja` y `POST /api/publico/pagos` no tienen protección por clave; solo por estado de cuotas.
- **Qué necesita el front.** Protección contra doble envío en red inestable. Hoy se mitiga deshabilitando el botón y sin reintentos (FB9 de `00-decisiones-base.md`).
- **Contrato mínimo propuesto.**
  ```text
  Header opcional: Idempotency-Key: <uuid>   en POST /api/pagos/caja, POST /api/publico/pagos, POST /api/cotizaciones
  Respuesta repetida con la misma clave: mismo status y body (ventana de 24 h).
  ```
- **Pantallas que desbloquea.** W4, B7, B10, B12 (mayor seguridad, no desbloquea).
- **Severidad.** Degrada.
- **Workaround front.** Botón deshabilitado durante el envío, `retry: 0` en mutaciones, y no reenviar a ciegas tras error de red (`pagos-facturas.md` §9.2).

### PB-13. Enums: converter global y uniformidad

- **Qué pasa hoy.** `backend/Aseguradora.Api/Program.cs:19` llama solo `AddControllers()`, sin `JsonStringEnumConverter`. Los enums de pólizas y cuotas viajan como número (`estado: 1`). `PagoResponse` (`Application/Dtos/PagoResponse.cs:5`) y `FacturaResponse` mandan texto en mayúsculas (`PENDIENTE`, `APROBADO`, `PASARELA`, `PENDIENTE_CAE`). El único `JsonStringEnumConverter` está en el cliente saliente de DNRPA (`Integrations/Dnrpa/DnrpaHttpService.cs:22`) y no afecta la API. Las respuestas de `ConsultaPublicaResponse` usan `ToUpperInvariant` sobre el nombre del enum. Hay tres formatos distintos en la misma API.
- **Qué necesita el front.** Un único formato por enum. FB7 pide un mapa por enum en `@nexa/api`; con formato mixto, el mapa tiene que conocer el dominio y el endpoint.
- **Contrato mínimo propuesto.**
  ```csharp
  // Program.cs
  builder.Services.AddControllers().AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)));
  ```
  Con esto, `estado` sale como `"Vigente"` en pólizas y cuotas. Es un cambio de contrato que requiere aviso al equipo y coordinación de las PR abiertas. Alternativa si no se aprueba: documentar el mapa `(dominio, valor)` en `@nexa/api`.
- **Pantallas que desbloquea.** Todas las de pólizas, cuotas y vehículos (legibilidad, sin cambio de lógica).
- **Severidad.** Degrada.
- **Workaround front.** Mapa `(dominio, número)` y `(dominio, string)` en `@nexa/api` (FB3 de `00-decisiones-base.md`).

### PB-14. Códigos estables en los 400 de negocio

- **Qué pasa hoy.** `Application/Exceptions/BusinessRuleException.cs` no tiene `Codigo`. `Middleware/ExceptionMiddleware.cs:43-44` solo escribe la extensión `codigo` cuando la excepción es `NotFoundException` con `Codigo`. Resultado: los 400 de negocio (duplicado de DNI o email, menor de edad, patente duplicada, `VEHICULO_NO_ENCONTRADO`) no tienen código. `VEHICULO_NO_ENCONTRADO` se pone como prefijo dentro de `detail` (`VehiculoService.cs:55`), con otra convención que `CLIENTE_NO_ENCONTRADO`, que va en `codigo`.
- **Qué necesita el front.** Marcar el campo correcto del formulario sin comparar texto en español, que cambia si se corrige la redacción.
- **Contrato mínimo propuesto.**
  ```csharp
  // BusinessRuleException(string message, string codigo)  -> ProblemDetails.codigo
  // Códigos: DNI_DUPLICADO, EMAIL_DUPLICADO, MENOR_DE_EDAD, PERSONA_FALLECIDA, PERSONA_NO_ENCONTRADA, VEHICULO_NO_ENCONTRADO, PATENTE_DUPLICADA, TITULAR_NO_COINCIDE
  ```
  `VEHICULO_NO_ENCONTRADO` debe salir en `codigo` y sacarse del prefijo de `detail`.
- **Pantallas que desbloquea.** B4, B6, B8, W4 (mensaje en el campo correcto).
- **Severidad.** Degrada.
- **Workaround front.** Comparación de texto o mensaje genérico del `detail`.

### PB-15. Mensajes de validación en inglés

- **Qué pasa hoy.** Los atributos sin `ErrorMessage` (por ejemplo `[Required]`, `[EmailAddress]`, `[MaxLength]` en `ClienteAltaRequest` de la PR #50 y `ConsultaPublicaRequest.cs:9,14`) devuelven el texto por defecto de ASP.NET en inglés dentro de `errors` (`contratos-api/seguridad-clientes-publico.md` §4.2). Los DataAnnotations sí tienen mensaje en español cuando lo definieron.
- **Qué necesita el front.** Mensajes que puedan mostrarse tal cual, o al menos un código por campo.
- **Contrato mínimo propuesto.** Agregar `ErrorMessage` en español a todos los atributos de DTOs públicos y de backoffice, o un `InvalidModelStateResponseFactory` que devuelva `errors` con códigos (`REQUERIDO`, `FORMATO_INVALIDO`, `LARGO_EXCEDIDO`).
- **Pantallas que desbloquea.** B1, B4, B14, W2 (mensajes de campo sin mapeo manual).
- **Severidad.** Degrada.
- **Workaround front.** Mapeo por clave de `errors` a mensajes propios (FB7 punto 6).

### PB-16. `DateTime` sin sufijo `Z`

- **Qué pasa hoy.** El repositorio no tiene `HasConversion` ni `ValueConverter` para `DateTime` (búsqueda en `backend/Aseguradora.Data`: sin resultados, según `contratos-api/convenciones-transversales.md` §5.3). SQL Server devuelve `Kind = Unspecified`, así que los campos leídos de la base salen sin `Z` (ejemplo: `fechaEmision` en `GET` de póliza, `fechaPago` de cuota). Los valores calculados en memoria salen con `Z`. Mismo campo, dos formatos según el endpoint. **Este punto no se pudo confirmar en ejecución**; es inferencia desde el código (ver Afirmaciones).
- **Qué necesita el front.** Un único formato UTC.
- **Contrato mínimo propuesto.** `ValueConverter` para `DateTime` en `Data/Configurations` que marque `Kind = Utc` al leer, o normalizar en Application. Todas las respuestas `DateTime` con `Z`.
- **Pantallas que desbloquea.** B9, B10, W6, B11 (horas correctas en zona de Argentina).
- **Severidad.** Degrada.
- **Workaround front.** Tratar todo `DateTime` sin offset como UTC (`new Date(valor.endsWith('Z') ? valor : valor + 'Z')`).

### PB-17. `Retry-After` en 429 y `Content-Disposition` no expuesto por CORS

- **Qué pasa hoy.** `Security/PublicoRateLimitExtensions.cs:74-89` escribe el 429 sin header `Retry-After`. El texto fijo "Volvé a intentarlo en un minuto" (línea 25) no depende de la ventana configurada (`RateLimiting:Publico:WindowSeconds`). `Program.cs:49-54` configura CORS sin `WithExposedHeaders`, así que `Content-Disposition` de la base positiva (`PagoFacilController.cs:73`) y `Location` no son legibles desde el navegador. (Sí existe `Retry-After: 15` en 503, `ExceptionMiddleware.cs:49`.)
- **Qué necesita el front.** Contador de espera exacto en W2, W3 y W4, y nombre de archivo de la base positiva sin parseo del contenido.
- **Contrato mínimo propuesto.**
  ```csharp
  // PublicoRateLimitExtensions: http.Response.Headers.RetryAfter = ventanaSegundos.ToString();
  // Program.cs: .WithExposedHeaders("Retry-After", "Content-Disposition", "Location");
  ```
- **Pantallas que desbloquea.** W2, W3, W4 (contador), B12 (nombre del archivo).
- **Severidad.** Degrada.
- **Workaround front.** Espera fija de 60 s; nombre de archivo armado desde el registro `H` de la base positiva.

### PB-18. Desborde de importe en cupón y base positiva

- **Qué pasa hoy.** `Application/PagoFacil/CodigoBarrasPagoFacil.cs:103-110` usa 7 dígitos para el segundo importe en centavos (máximo $99.999,99). Con el 5 % de recargo, una cuota de más de ~$95.237 responde 400 en el cupón, y en la base positiva **falla el archivo entero** (`BasePositivaService`, `contratos-api/polizas-cuotas-pagofacil.md` §8.1). Este cálculo no se reejecutó en esta sesión.
- **Qué necesita el front.** Que el cupón y la base positiva funcionen con primas altas (el plan TR tiene prima base de $30.000 y el factor de uso comercial da 1,40, así que pasa el umbral).
- **Contrato mínimo propuesto.** Ampliar el campo a 8 dígitos (requiere confirmar el layout de Pago Fácil, D15 de `polizas-cuotas-pagofacil.md`), o excluir la cuota con error de la base positiva y devolver su lista en el response.
- **Pantallas que desbloquea.** B12 (base positiva completa), W5 y B10 (cupón de cuotas altas).
- **Severidad.** Degrada (depende del layout).
- **Workaround front.** Mostrar "no disponible para este importe" en el cupón.

### PB-19. Rendición: 201 con líneas rechazadas y resultado no persistido

- **Qué pasa hoy.** `PagoFacilController.cs:38-51`: `POST /api/pagofacil/rendiciones` responde 201 aunque todas las líneas fallen (`RendicionResponse.errores`). El resultado no se persiste: no hay `GET /api/pagofacil/rendiciones/{id}` y `HistorialRendicionResponse` no guarda errores (`contratos-api/polizas-cuotas-pagofacil.md` §7.3, §7.4). Además, los errores de línea van en un solo `detail` separados por `; ` en los 400 de formato.
- **Qué necesita el front.** Mostrar el resultado después de salir de la pantalla y tratar el 201 con rechazos como resultado parcial, no como error.
- **Contrato mínimo propuesto.**
  ```ts
  // GET /api/pagofacil/rendiciones/{id} -> RendicionResponse (incluye errores[])
  // POST: responder 201 con Location: /api/pagofacil/rendiciones/{id}   (Location solo es legible si se expone, PB-17)
  // 400 de formato: errores como array en ValidationProblemDetails-like: { errores: [{ linea, motivo }] }
  ```
- **Pantallas que desbloquea.** B12 (resultado persistente y lista de errores estructurada).
- **Severidad.** Degrada.
- **Workaround front.** Botón de copiar o descargar el resultado antes de navegar; partir el `detail` por `; `.

### PB-20. Fecha de vencimiento de la cuota 1 (Figma vs código)

- **Qué pasa hoy.** `Domain/Services/CalculadorCuotas.cs:24-33`: la cuota `n` vence `primerDiaDelMes(inicio).AddMonths(n).AddDays(9)`, es decir, el día 10 del mes siguiente al inicio más `n` meses. Para inicio `01/11/2026` la cuota 1 vence `10/12/2026`. El Figma (B8) muestra `10/11/2026` y las siguientes un mes antes. Con 6 cuotas, la última (`10/05/2027`) vence después de `FechaFin` (`01/05/2027`), y la póliza pasa a `Vencida` con la cuota 6 todavía pendiente (`VencimientosService`, D17 de `polizas-cuotas-pagofacil.md`).
- **Qué necesita el front.** Una regla única que el Figma muestre igual que el back.
- **Contrato mínimo propuesto.** Decisión de negocio de RN07: (a) el back cambia la regla al mes de inicio; o (b) el Figma cambia a `10/12/2026` y así sucesivamente. Documentar en la spec y dejar la fecha en `CuotaResponse.fechaVencimiento` como única fuente.
- **Pantallas que desbloquea.** B8 (preview de cuotas), B10 (fechas de cuotas y emisión).
- **Severidad.** Bloquea (la pantalla de emisión muestra fechas distintas a las que se van a cobrar).
- **Workaround front.** Mostrar la fecha que devuelve el back después de emitir; en la preview, leyenda "fechas a confirmar".

### PB-21. Segundo vencimiento del cupón: 17/11 (Figma) vs 20/11 (back)

- **Qué pasa hoy.** `Application/PagoFacil/CuponPagoFacilService.cs:22` define `DiasAlSegundoVencimiento = 10` y `:52` calcula `fecha2 = fecha1.AddDays(10)`. Con primer vencimiento el 10/11, el segundo es el 20/11. El Figma W5 muestra 17/11 (7 días).
- **Qué necesita el front.** Un dato de negocio confirmado.
- **Contrato mínimo propuesto.** Decisión: 7 o 10 días. Si son 7, cambiar la constante. Si son 10, cambiar el Figma. Confirmar con Pago Fácil (dato de cátedra, W5 D4).
- **Pantallas que desbloquea.** W5, W4 (importes y fechas del cupón).
- **Severidad.** Bloquea (el cliente vería una fecha que el back no respeta).
- **Workaround front.** Mostrar la fecha que devuelve `fechaSegundoVencimiento` del DTO, nunca la del Figma.

### PB-22. Medios de pago: `pasarela1`/`pasarela2` sin nombre comercial

- **Qué pasa hoy.** `Application/Services/PagoService.cs:27` acepta `["pasarela1", "pasarela2"]` y `:136` normaliza a minúsculas. El Figma (W4) muestra "Pasarela A" y "Pasarela B" (y el mapeo de cuál es cuál no está definido). El back no devuelve el nombre comercial en ningún endpoint público. Tampoco hay listado de proveedores habilitados.
- **Qué necesita el front.** Lista de medios con nombre visible y orden, para no hardcodear los proveedores.
- **Contrato mínimo propuesto.**
  ```ts
  // GET /api/publico/medios-pago -> { proveedor: 'pasarela1' | 'pasarela2'; nombre: string; orden: number; activo: boolean }[]
  ```
- **Pantallas que desbloquea.** W4 (opciones de pago), W6 (nombre de la pasarela usada).
- **Severidad.** Bloquea.
- **Workaround front.** Opciones fijas "Pasarela A" / "Pasarela B" con `proveedor` interno; mapeo a confirmar con el equipo.

### PB-23. Vista previa DNRPA por patente

- **Qué pasa hoy.** `Controllers/VehiculosController.cs` tiene `POST /api/vehiculos` (línea 23), `GET` (39), `GET /{id}` (58), `PUT /{id}` (69) y `DELETE /{id}` (81). `POST` valida, consulta DNRPA y guarda en un solo paso. No hay consulta previa por patente. Por el mismo motivo, el titular DNRPA no se puede mostrar antes de guardar.
- **Qué necesita el front.** B6 muestra el paso "Validar en DNRPA" con datos antes de guardar.
- **Contrato mínimo propuesto.**
  ```ts
  // GET /api/vehiculos/dnrpa/{patente}  (Politicas.Empleado; mismo criterio que GET /api/clientes/renaper/{dni})
  interface VehiculoDnrpaPreview { patente: string; marca: string; modelo: string; anio: number; tipo: TipoVehiculo; titularDniEnmascarado: string; coincideConCliente: boolean | null; }
  ```
  Ojo: el DNI del titular completo es dato sensible; enmascararlo.
- **Pantallas que desbloquea.** B6 (flujo completo del Figma).
- **Severidad.** Bloquea.
- **Workaround front.** B6 hace el alta en un paso; el botón "Validar" se quita del diseño (decisión de producto).

### PB-24. Listado global de cuotas por estado

- **Qué pasa hoy.** No existe `GET /api/cuotas`. `GET /api/polizas/{id}/cuotas` (`PolizasController.cs:65`) es por póliza. Ningún endpoint lista cuotas vencidas de todas las pólizas.
- **Qué necesita el front.** B2 (KPI "Cuotas vencidas" y tabla de recientes) y B5 (deuda del cliente).
- **Contrato mínimo propuesto.**
  ```ts
  // GET /api/cuotas?estado=Vencida&pagina=&tamano=&orden=fechaVencimiento  (Politicas.Empleado)
  // -> PaginaResponse<CuotaListItem>  con cuotaId, polizaId, numeroPoliza, clienteNombre, clienteApellido, numeroCuota, fechaVencimiento, importe, recargo, estado
  ```
  Ojo: el filtro `estado` depende de PB-13.
- **Pantallas que desbloquea.** B2 (KPI y tabla), B5 (deuda).
- **Severidad.** Bloquea (B2).
- **Workaround front.** Sin KPI de cuotas vencidas; tabla oculta.

### PB-25. Cobro en caja sin forma de pago

- **Qué pasa hoy.** `Dtos/PagoCajaRequest.cs:8-10` solo tiene `cuotaIds`. `PagoService.cs:77` siempre asigna `MedioPago.Caja`. El back no distingue efectivo de otras formas de cobro (`pagos-facturas.md` §4.3).
- **Qué necesita el front.** Registrar la forma de pago que cobró el empleado.
- **Contrato mínimo propuesto.** `formaPago?: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'` en `PagoCajaRequest`, guardado en `Pago`. Decisión de negocio.
- **Pantallas que desbloquea.** B10 (cobro en caja), B11 (columna de forma de pago).
- **Severidad.** Mejora.
- **Workaround front.** No se muestra forma de pago.

### PB-26. `POST /api/cotizaciones` no es idempotente y no hay listado

- **Qué pasa hoy.** `Application/Services/CotizacionService.cs:76-98` persiste una cotización por plan en cada llamada. `GET /api/cotizaciones/{id}` devuelve una cotización. No hay listado por vehículo ni por cliente (`vehiculos-planes-cotizaciones.md` D11). Por eso, si B7 llama al POST al montar, cada recarga crea tres cotizaciones nuevas, y el front no puede reconstruir la lista de planes a partir de un id (`pantallas/B7-cotizar.md` D-B7-01).
- **Qué necesita el front.** Reconstruir la cotización al recargar, y no duplicar.
- **Contrato mínimo propuesto.**
  ```ts
  // GET /api/vehiculos/{id}/cotizaciones?vigentes=true  -> CotizacionDto[]  (Politicas.Empleado)
  // o bien POST /api/cotizaciones con Idempotency-Key (PB-12)
  ```
- **Pantallas que desbloquea.** B7 (recarga sin duplicados), B5 (historial de cotizaciones).
- **Severidad.** Degrada.
- **Workaround front.** Cotizar solo al hacer clic en "Cotizar" y guardar el resultado en memoria; la recarga vuelve a cotizar.

### PB-27. Datos de cancelación, emisor, historial y cliente en el detalle de póliza

- **Qué pasa hoy.** Según `contratos-api/polizas-cuotas-pagofacil.md` §10 y §5.3, `PolizaDetalleResponse` no trae `fechaCancelacion` ni `motivoCancelacion` (aunque `Poliza.cs:24-25` los tiene), ni el empleado que emitió, ni el nombre del cliente, ni un historial de cambios de estado (no hay tabla de historial). La cancelación por RN19 no muestra motivo.
- **Qué necesita el front.** B10: motivo y fecha de cancelación, emisor, historial de estados (`Emitida`, `Vigente`, `Suspendida`...) y datos del cliente en el encabezado.
- **Contrato mínimo propuesto.**
  ```ts
  // Agregar a PolizaDetalleResponse:
  fechaCancelacion: string | null; motivoCancelacion: string | null; emitidaPor: string; // nombre del empleado
  historialEstados: { estado: EstadoPoliza; fecha: string; motivo: string | null }[];   // requiere tabla nueva
  // Cliente: GET /api/clientes/{id} (PB-03)
  ```
- **Pantallas que desbloquea.** B10 (motivo, emisor, historial, cabecera).
- **Severidad.** Degrada (historial es Bloquea para el paso 3 del diseño).
- **Workaround front.** Sin historial; motivo y fecha solo si el back los agrega.

### PB-28. Deuda consolidada del cliente para un Empleado

- **Qué pasa hoy.** `Controllers/DeudaExternaController.cs:14-19` expone `GET /api/externo/clientes/{dni}/deuda` con `Politicas.ApiKey` (línea 15). Un Empleado con JWT no tiene endpoint de deuda por cliente.
- **Qué necesita el front.** B5 (rail "Cuenta") necesita deuda vencida, cuota vencida con recargo y próxima cuota.
- **Contrato mínimo propuesto.**
  ```ts
  // GET /api/clientes/{id}/cuenta  (Politicas.Empleado) -> { deudaVencida: number; cuotaVencidaConRecargo: CuotaListItem | null; proximaCuota: CuotaListItem | null; }
  ```
  Recomendable que la lógica de RN08 quede en Application (B5 D-B5-05, opción a).
- **Pantallas que desbloquea.** B5 (rail Cuenta).
- **Severidad.** Bloquea (rail de B5).
- **Workaround front.** Se oculta el rail "Cuenta"; el encabezado queda sin deuda.

### PB-29. Validación de CUIL, DNI de 7 dígitos y límites de rate limit

- **Qué pasa hoy.** `ClienteAltaRequest` (PR #50) valida CUIL solo por 11 dígitos, sin dígito verificador (`contratos-api/seguridad-clientes-publico.md` D6). `ConsultaPublicaRequest` exige DNI de 8 dígitos (`ConsultaPublicaRequest.cs:10`), así que personas con DNI de 7 dígitos no pueden consultar ni darse de alta (D7). El rate limit es 10/min por IP compartido entre consulta, factura y pagos (`PublicoRateLimitExtensions.cs:18-19`).
- **Qué necesita el front.** Reglas claras antes de construir formularios.
- **Contrato mínimo propuesto.** (a) Validar dígito verificador de CUIL; (b) decidir si el DNI de 7 dígitos se acepta con cero a la izquierda; (c) subir el límite de `/api/publico/factura` o separarlo del de consulta.
- **Pantallas que desbloquea.** B4 (CUIL), W2 (DNI corto), W3/W4 (polling de factura).
- **Severidad.** Mejora.
- **Workaround front.** Validación de formato sin dígito verificador; mensaje sobre límite de intentos.

### PB-30. Póliza `Vencida` o `Cancelada` con cuotas impagas

- **Qué pasa hoy.** `Controllers/` no filtra por estado de póliza al cobrar o dar cupón: `CuponPagoFacilService.cs:29-30` valida solo el estado de la cuota (`polizas-cuotas-pagofacil.md` D6). Una cuota de una póliza `Vencida` queda `Pendiente` o `Vencida` y se puede cobrar. La base positiva sí excluye pólizas `Vencida` (`BasePositivaService.cs:23-24`). Las cuotas de una póliza `Cancelada` ya quedan `Anuladas` (RN13), así que ahí no hay problema.
- **Qué necesita el front.** Regla clara de cobro de cuotas de pólizas vencidas.
- **Contrato mínimo propuesto.** Decisión de negocio: (a) rechazar cupón y pago con 400 `"La póliza está vencida y sus cuotas no se pueden cobrar."`; (b) permitir y documentarlo. Con (a), agregar el chequeo en `CuponPagoFacilService` y en `PagoService`.
- **Pantallas que desbloquea.** B10, B9 (acciones sobre cuotas de póliza vencida).
- **Severidad.** Degrada.
- **Workaround front.** Se muestra la cuota como impaga y se habilita el cupón hasta que el back decida (D6).

### PB-31. Cambio obligatorio de contraseña en el primer ingreso y política de contraseña fuerte

- **Qué pasa hoy.** `AuthController` solo tiene `POST /api/auth/login` y `POST /api/auth/usuarios` (`AuthController.cs:21,29`). No hay endpoint para cambiar la contraseña ni un indicador de "debe cambiarla" en `Usuario` (`Usuario.cs`) ni en `LoginResponse` (`LoginResponse.cs`: `Token`, `Rol`, `ExpiraEn`). `AddIdentityCore<Usuario>()` se registra sin opciones (`IdentityExtensions.cs:15`), así que rigen los defaults de Identity (6 caracteres, mayúscula, minúscula, dígito y símbolo). Un administrador crea al empleado con una contraseña temporal (B-24, RV-D18) y esa contraseña no vence nunca.
- **Qué necesita el front.** Saber en el login que la cuenta debe cambiar la contraseña, un endpoint para cambiarla y que el back impida usar el resto de la API hasta que se cambie. Sin eso, la pantalla de cambio obligatorio (US-FE-B-26) sería solo una barrera de la UI que cualquiera con el token puede saltear.
- **Contrato mínimo propuesto.** (a) `Usuario.DebeCambiarPassword` (bool, `true` al crear por `POST /api/auth/usuarios`); (b) `LoginResponse.DebeCambiarPassword` y un claim `cambiar_password` en el JWT; (c) `POST /api/auth/cambiar-password` con `{ passwordActual, passwordNueva }` que devuelve 200 con un `LoginResponse` nuevo (token sin el claim); (d) las políticas `Empleado` y `Admin` rechazan con 403 `PASSWORD_CAMBIO_REQUERIDO` los tokens con el claim, salvo el endpoint de cambio; (e) política fuerte (mínimo 12 caracteres, mayúscula, minúscula, dígito y símbolo) que rige para el alta, el cambio y el seed del administrador. Un error de contraseña actual incorrecta responde 400 y no 401, para no disparar el cierre de sesión global del front.
- **Pantallas que desbloquea.** B1 (el login ramifica según el indicador), B14 (la temporal deja de ser permanente) y la pantalla nueva de cambio obligatorio (US-FE-B-26).
- **Severidad.** Degrada (B-24 se entrega igual; hasta que exista, la contraseña temporal no vence).
- **Workaround front.** US-FE-B-26 trabaja con MSW (`VITE_USE_MOCKS=true`): el handler de login devuelve `debeCambiarPassword: true` para un usuario de prueba y el de `POST /api/auth/cambiar-password` replica el contrato propuesto. Tarjeta del back: `US-F1-09` en `docs/tareas-divididas.md`.

### PB-32. Búsqueda de clientes: apellido sin tildes (resuelto) y DNI por prefijo (abierto)

- **Qué pasaba.** `ClienteService.ListarAsync` filtraba el apellido con `ToLower().Contains(...)` y la collation por defecto de SQL Server distingue tildes: buscar "pe" o "perez" no devolvía a "Pérez".
- **Resuelto.** PR #131 (`fix/back-busqueda-clientes-sin-acentos`): el apellido se compara sin tildes (á é í ó ú ü) y sin mayúsculas; la ñ se conserva. El mock (`packages/api/mocks/handlers/clientes.ts`) replica el mismo comportamiento.
- **Abierto.** El filtro `dni` es de igualdad exacta (8 dígitos); el front clasifica un texto de menos de 8 dígitos como apellido, así que escribir "30" no encuentra por DNI. Si se quiere búsqueda por prefijo de DNI hace falta que el back acepte `dni` parcial (desde 3 dígitos); es un cambio de contrato a decidir con el equipo.
- **Pantallas que toca.** B3 (listado de clientes).
- **Severidad.** Degrada (solo el DNI parcial).
- **Workaround front.** Escribir el DNI completo o el apellido. El front ya espera 300 ms de inactividad antes de consultar (B-04).

---

## Afirmaciones que NO se confirmaron

Las siguientes afirmaciones de `docs/frontend/` requieren contraste con el código; cada entrada indica su verificación o pendiente:

1. **`contratos-api/convenciones-transversales.md` §3.2 y `pagos-facturas.md` §2.2**: afirman que el 503 emite `Retry-After: 15` con valor fijo. El código sí escribe el header (`ExceptionMiddleware.cs:49`), pero el valor sale de `ServicioNoDisponibleException.ReintentarEnSegundos`; el valor "15" no fue releído. **Confirmado parcialmente.**
2. **`convenciones-transversales.md` §1.4**: afirma que el 429 "no trae `Retry-After`". **Confirmado** (`PublicoRateLimitExtensions.cs:74-89` no escribe el header).
3. **`convenciones-transversales.md` §1.4 / `seguridad-clientes-publico.md` §1.4**: afirman ventana fija de 60 s y límite de 10. **Confirmado** (`PublicoRateLimitExtensions.cs:18-19`, `:59-62`, `FixedWindowRateLimiterOptions`).
4. **`pagos-facturas.md` §4.2 y `B1`/`W4`**: afirman que "Pago Fácil no es una opción online". Coherente con el código (`PagoService.cs:27` solo acepta `pasarela1`/`pasarela2`). **Confirmado.**
5. **`convenciones-transversales.md` §5.1 y `polizas-cuotas-pagofacil.md` §1.3**: afirman que `EstadoPoliza` y `EstadoCuota` viajan como número. **Confirmado** por la ausencia de converter en `Program.cs:19`.
6. **404 de cliente con código estable:** confirmado en `backend/Aseguradora.Application/Clientes/ClienteService.cs`: `CodigoClienteNoEncontrado = "CLIENTE_NO_ENCONTRADO"` se pasa a `NotFoundException` en `BuscarActivoAsync` y al reintentar Renaper sobre un cliente inexistente. `ExceptionMiddleware.cs` escribe ese código en `ProblemDetails`. Ya no depende de PR #50 ni queda como uso sin verificar.
7. **`polizas-cuotas-pagofacil.md` §4.2 y §5.4** (mensajes de `PolizaService.cs` por línea, `motivo` con `[Required(AllowEmptyStrings=false)]`): no releí `PolizaService.cs` ni `CancelarPolizaRequest.cs` en esta sesión. **No verificado.**
8. **`pantallas/B8-emitir-poliza.md` D3** (`FechaInicio` = hoy, `PolizaService.cs:38, 61`): no releí el servicio. **No verificado**, aunque es coherente con `CalculadorCuotas`.
9. **`convenciones-transversales.md` §5.3 y `polizas-cuotas-pagofacil.md` §1.5** (`DateTime` sin `Z` al leer de SQL Server): no hay `ValueConverter` (confirmado por búsqueda), pero el comportamiento de serialización no se verificó en ejecución. **Inferencia, no confirmada.** PB-16 lo marca así.
10. **`pagos-facturas.md` §5 paso 4 (`ReservaMinutos` = 60)**: no releí `PagoOnlineOpciones.cs:31`. **No verificado.**
11. **`B2-inicio.md` D-3 y `B6` D-B6-07** (Empleado ve Planes y Usuarios en el sidebar): el back sí restringe `POST/PUT/DELETE /api/planes` y `POST /api/auth/usuarios` a `Politicas.Admin` (`PlanesController.cs:36,49,60`; `AuthController.cs:30`). La conclusión del documento es correcta. **Confirmado.**
12. **`W3-mi-poliza.md` §13 punto 1 y `W5` D5** (`ConsultaPublicaResponse` no trae titular): el comentario de clase lo confirma (`ConsultaPublicaResponse.cs:4-7`). **Confirmado.**
13. **`design-system.md`**: no se verificó contra código (no aplica a backend). Los contrastes quedan pendientes de herramienta; **no evaluado**.
14. **`B6` D-B6-05** (enums como número): **Confirmado** (PB-13).
15. **`B5` D-B5-04** ("próximo vencimiento" de la póliza): `PolizaListItemResponse` no tiene fecha de próximo vencimiento (no releído el record completo). **Confirmado parcialmente** (los campos listados en `polizas-cuotas-pagofacil.md` §5.2.1 no incluyen esa fecha).

---

## Anexo: pedidos sin hueco confirmado

- `DeudaExternaService`, `RendicionService` y `CuponPagoFacilService` tienen los mensajes citados en los documentos; no los reverifiqué línea por línea.
- Ningún endpoint de "fechas de cuotas" ni de "ventana de reserva" tiene discrepancia verificada salvo PB-20.
