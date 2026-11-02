# US-FE-B-07: Ficha de cliente: cabecera, pestañas, vehículos y pólizas

Tipo: B · Oleada: 5 · Tamaño: M · Rama sugerida: `feature/US-FE-B-07-ficha-cliente` · Tarjeta Trello: `US-FE-B-07`

Pantalla: [B5 Ficha de cliente](../pantallas/B5-ficha-cliente.md). Índice: [INDEX](INDEX.md), fila US-FE-B-07.

---

## 1. Objetivo

En `/clientes/:clienteId`, el empleado o el administrador ve la ficha de un cliente: nombre, DNI, CUIL y estado Renaper; la pestaña Vehículos (activa por defecto) con cada vehículo y su póliza activa o el acceso a cotizar; debajo, la lista de pólizas del cliente con su próxima cuota; y el rail con la acción de agregar vehículo. Desde acá salen la edición y la baja, que implementa B-08. Esta tarea es dueña del hook `useCliente` y de la ruta dinámica del feature.

## 2. Alcance

**Entra**
- Ruta `/clientes/:clienteId` (dinámica, después de `/clientes/nuevo`).
- Cabecera `ClienteEncabezado`: avatar con iniciales, nombre (H1), metadatos `DNI` y `CUIL`, badge Renaper, y espacio para las acciones que B-08 agrega.
- Pestañas `Datos` y `Vehículos` con `?tab=`. Vehículos activa por defecto (D-17).
- Pestaña Vehículos: lista de vehículos con su póliza activa o `Sin póliza activa` + `Cotizar`; y debajo, la sección `Pólizas` apilada (D-17).
- Pestaña Datos: contacto y domicilio en modo lectura (propuesta, sección 13).
- Rail con el bloque `Acciones` (solo "Agregar vehículo").
- Estados: carga, 404, error con reintento, vacío de vehículos y de pólizas.

**NO entra**
- Edición de contacto y domicilio, baja lógica y reintento de Renaper: **US-FE-B-08** (B-07 deja el espacio de las acciones; sin callbacks no se muestran los botones).
- Bloque "Cuenta" del rail (deuda y próxima cuota): oculto (D-33, PB-28).
- Pestaña Pagos: sin diseño (sección 13).
- Acciones "Nueva cotización" y "Registrar pago en caja" del rail: sin destino definido (sección 13).
- Pantallas de vehículo (B-09), cotización (B-10) y póliza (B-15): solo se enlazan por ruta.
- Requests de cliente (T-24), vehículos (T-26) y pólizas y cuotas (T-28), y sus mocks.

## 3. Dependencias

- **Oleada:** 5.
- **Depende de:** US-FE-B-04, US-FE-T-06, US-FE-T-07, US-FE-T-09, US-FE-T-10, US-FE-T-11, US-FE-T-16, US-FE-T-19, US-FE-T-24, US-FE-T-26, US-FE-T-28.
- **Puede empezar sin esperar a:** US-FE-B-09 (nuevo vehículo; esta ficha solo enlaza a su ruta).
- **Bloqueada por pedidos al back:** PB-03 (MSW; la cabecera usa el mock de T-24) y PB-28 (MSW; el bloque Cuenta queda oculto).

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (reglas de feature), FB4 (formatos de DNI, fecha e importe), FB7.7, FB7.11.
- `docs/frontend/pantallas/B5-ficha-cliente.md`: §2 (ruta, query `?tab=`, 404), §3 (estructura: encabezado, pestañas, lista de vehículos, pólizas, rail), §4 (componentes propios: `ClienteEncabezado`, `ClienteTabs`, `VehiculoFila`, `PolizasTabla`, `AccionesRapidas`), §5 (textos literales), §6 (campos y formatos), §7 (estados), §8 (acciones y navegación), §9 (endpoints y origen de cada dato), §10 (RN03, RN04, RN07, RN08, RN14), §12 (accesibilidad), §13 (D-B5-01, D-B5-03, D-B5-04, D-B5-06, D-B5-07, D-B5-09, D-B5-10, D-B5-11, D-B5-14, D-17 de INDEX).
- `docs/frontend/contratos-api/vehiculos-planes-cotizaciones.md`: §2.2 (`GET /api/vehiculos?clienteId`, `VehiculoResponse`, 400 si falta `clienteId`).
- `docs/frontend/contratos-api/polizas-cuotas-pagofacil.md`: §1.3 (enums como número), §3.1 (estados de póliza), §5.2 (`GET /api/polizas`, `PolizaFiltroQuery`, `PolizaListItemResponse`), §5.5 (`CuotaResponse`, sin paginación), §10 (de dónde sale cada bloque del detalle).
- `docs/frontend/contratos-api/seguridad-clientes-publico.md`: §3.4 (detalle: 404 si está inactivo; PUT y DELETE son de B-08).
- `docs/frontend/design-system.md`: §5.4 (Badge/Estado), §5.12 (Table), §5.13 (Card/Widget), §5.6 (NavItem, no aplica), §7.1 (grilla), §8.3 (foco y tabs).
- `docs/frontend/pedidos-al-back.md`: PB-03, PB-13, PB-28.
- `docs/frontend/tareas/INDEX.md`: FC2 (hooks por feature y keys), FC9 (formateadores), FC14 (rutas estáticas antes que dinámicas), FC16 (tabs).

## 5. Archivos a crear o modificar

Bajo `frontend/apps/backoffice/src/features/clientes/` (feature de B-04; esta tarea agrega):

| Archivo | Notas |
|---|---|
| `pages/FichaClientePage.tsx` | Compone encabezado, pestañas, rail y estados. Recibe `onEditar` y `onDarDeBaja` opcionales (B-08). |
| `components/ClienteEncabezado.tsx` | Avatar, nombre, metadatos, badge y acciones opcionales. |
| `components/ClienteTabs.tsx` | Tabs con patrón `tablist`, `tab`, `tabpanel` (T-06) y `?tab=`. |
| `components/DatosClienteLectura.tsx` | Contacto y domicilio en modo lectura (pestaña Datos). |
| `components/VehiculoFila.tsx` | Fila de vehículo con su póliza activa o `Cotizar`. Ver sección 16. |
| `components/PolizasClienteTabla.tsx` | Tabla de pólizas con próxima cuota. Ver sección 16. |
| `components/AccionesRapidas.tsx` | Rail con "Agregar vehículo". |
| `api/useCliente.ts` | Dueño de este hook (INDEX). `useQuery` con `clientesKeys.detalle(id)` de T-24. |
| `api/useVehiculosDelCliente.ts` | `useQuery` sobre T-26 con `clienteId`. |
| `api/usePolizasDelCliente.ts` | `useQuery` sobre T-28 con `clienteId` y `tamano: 100`. |
| `api/useProximasCuotas.ts` | `useQueries` sobre `GET /api/polizas/{id}/cuotas`, solo para pólizas Pendiente, Vigente o Suspendida. |
| `api/reglaPolizaActiva.ts` | RN04: qué estados cuentan como póliza activa y cómo se cruza un vehículo con su póliza. Función pura exportada para el hook y los tests. |
| `api/proximaCuota.ts` | Primera cuota con estado `Pendiente` (ver sección 13, D-B07-2). Función pura exportada para el hook y los tests. |
| `routes.tsx` | Agrega `/clientes/:clienteId` después de `/clientes/nuevo` (FC14). |
| Tests | `pages/FichaClientePage.test.tsx`, `api/reglaPolizaActiva.test.ts`, `api/proximaCuota.test.ts`, `components/VehiculoFila.test.tsx`. |

Compartidos (no editar): `packages/api/**` (T-24, T-26, T-28), `packages/ui/**`, `app/**`.

## 6. Pasos de implementación

1. Confirmar que B-04, T-06, T-07, T-09, T-10, T-11, T-16, T-19, T-24, T-26 y T-28 están mergeadas. Leer las funciones y keys reales (los nombres de §7 son sugeridos).
2. Escribir las funciones puras `api/reglaPolizaActiva.ts` y `api/proximaCuota.ts` con sus tests (sin React). Los componentes no calculan: los hooks devuelven ya resueltos `polizaActivaDeVehiculo(vehiculo)` y `proximaCuotaDePoliza(polizaId)`.
3. `useCliente`: `retry` por defecto de TanStack Query solo para errores de red; un 404 no se reintenta.
4. `useVehiculosDelCliente` y `usePolizasDelCliente`: solo se habilitan cuando el cliente cargó (`enabled: !!cliente`).
5. `useProximasCuotas`: una query por póliza de estado activo (Pendiente, Vigente, Suspendida), con la key de T-28. Las pólizas Vencida o Cancelada no piden cuotas.
6. `FichaClientePage`: lee `:clienteId` y `?tab=`. Si `tab` no es `datos` ni `vehiculos`, usa `vehiculos`.
7. `ClienteEncabezado`: avatar 56 px con iniciales de `nombre` y `apellido` (derivadas en el front, B5 §9). Metadatos `DNI` con formateador de T-09 y `CUIL` tal cual. Badge `Validado` o `Pendiente` con la etiqueta `Renaper`.
8. `ClienteTabs`: solo `Datos` y `Vehículos` (D-B07-1). Usa `role="tablist"`; las flechas mueven el foco entre pestañas (FC16).
9. `VehiculoFila`: icono de tipo (`car` o `motorcycle` según el mapa de T-10), título `marca modelo anio`, patente en mono, `tipo · uso`, badge `Validado` con la etiqueta `DNRPA` si `validadoDnrpa`. A la derecha, la póliza activa (número y badge) o `Sin póliza activa` + `Cotizar`.
10. Póliza activa del vehículo: la primera póliza del listado (ya viene por `fechaEmision` descendente) cuya `patente` coincide y cuyo estado está en RN04 (`Pendiente`, `Vigente`, `Suspendida`). La comparación de patente ignora mayúsculas y espacios.
11. `PolizasClienteTabla`: columnas `Número`, `Vehículo`, `Plan`, `Vigencia`, `Estado`, `Próx. vencimiento`. `Vehículo` sale del cruce por patente; si no hay cruce, `—`.
12. Rail: solo `AccionesRapidas` con "Agregar vehículo" (enlace a `/clientes/{id}/vehiculos/nuevo`).
13. Estados (§9). 404 muestra la página de no encontrado; un error muestra la alerta con "Reintentar".
14. Escribir los tests de §10 antes de los componentes; correr `lint`, `typecheck`, `test`, `build`.

## 7. Contrato con el back

| Método y ruta | Estado | Uso en B-07 |
|---|---|---|
| `GET /api/clientes/{id}` | Especificado (PB-03; mock de T-24) | Cabecera. 404 si no existe o está inactivo. |
| `GET /api/vehiculos?clienteId={uuid}` | Implementado | Lista de vehículos activos. Sin paginación. |
| `GET /api/polizas?clienteId={uuid}&tamano=100` | Implementado | Pólizas del cliente (tamaño máximo 100). |
| `GET /api/polizas/{id}/cuotas` | Implementado | Próxima cuota de cada póliza activa. Sin paginación. |

Tipos (en `@nexa/api`, dueños T-24, T-26 y T-28; no redefinir):

```ts
export interface ClienteResponse {       // T-24 (detalle; forma de ClienteResponse de PR #50 + activo)
  id: string; dni: string; cuil: string; nombre: string; apellido: string;
  fechaNacimiento: string; sexo: 'M' | 'F' | 'X'; email: string; telefono: string | null;
  calle: string; numero: string; localidad: string; provincia: string; codigoPostal: string;
  validadoRenaper: boolean; fechaValidacionRenaper: string | null; activo: boolean;
}

export interface VehiculoResponse {      // T-26, de vehiculos-planes §2.2
  id: string; clienteId: string; patente: string; marca: string; modelo: string;
  anio: number; tipo: number;            // número: mapear con T-10
  uso: number;                           // número: mapear con T-10
  validadoDnrpa: boolean; activo: boolean;
}

export interface PolizaListItemResponse { // T-28, de polizas-cuotas §5.2.1
  id: string; numero: string; clienteId: string; patente: string; codigoPlan: string;
  primaMensual: number; fechaInicio: string; fechaFin: string;
  estado: number;                        // EstadoPoliza por número: mapear con T-10
}

export interface CuotaResponse {         // T-28, de polizas-cuotas §5.5
  id: string; numero: number; importe: number; recargo: number;
  fechaVencimiento: string; estado: number;  // EstadoCuota por número: Pendiente=0, Vencida=1, Pagada=2, Anulada=3
  fechaPago: string | null;
}
```

- Query de pólizas: `estado` no se envía; el filtro es solo por cliente. Se envía `tamano: 100`; si `total` es mayor, ver sección 16.
- Sin mutaciones en esta tarea.
- PB-13 (degrada): los enums de vehículo y póliza llegan como número. Se mapean con T-10.
- Handler MSW: **No aplica** (T-24, T-26, T-28).

## 8. Contenido de UI

Textos literales de B5 §5. Los de muestra no se escriben.

| Zona | Texto |
|---|---|
| Volver | `Clientes` (con icono `arrow-left` decorativo) |
| Título (H1) | Nombre y apellido del cliente |
| Metadatos | `DNI {dni con puntos}` · `CUIL {cuil}` |
| Badge y etiqueta | `Validado` / `Pendiente` · `Renaper` |
| Pestañas | `Datos` · `Vehículos` |
| Encabezado de vehículos (propuesta; el diseño no lo tiene) | `Vehículos` |
| Vehículo: título | `{marca} {modelo} {anio}` |
| Vehículo: patente | `Patente` `{patente}` |
| Vehículo: tipo y uso | `{tipo} · {uso}` (Auto, Moto, Camioneta; Particular, Comercial) |
| Vehículo: validación | `Validado` + `DNRPA` |
| Vehículo: póliza | `Póliza` `{numero}` + badge de estado · o `Sin póliza activa` + `Cotizar` |
| Sección pólizas | `Pólizas` (H2) |
| Columnas de pólizas | `Número` · `Vehículo` · `Plan` · `Vigencia` · `Estado` · `Próx. vencimiento` |
| Vigencia | `{dd/MM/yyyy} a {dd/MM/yyyy}` |
| Próx. vencimiento sin cuota | `-` |
| Rail: título | `Acciones` |
| Rail: acción | `Agregar vehículo` |
| Vacío de vehículos (propuesta) | `Este cliente no tiene vehículos.` + botón `Agregar vehículo` |
| Vacío de pólizas (propuesta) | `Este cliente no tiene pólizas.` |
| Cliente no encontrado (propuesta) | `Cliente no encontrado.` + enlace `Volver a clientes` |
| Error de carga (propuesta) | `No pudimos cargar el cliente.` + botón `Reintentar` |
| Pestaña Datos (propuesta) | Etiquetas `Email`, `Teléfono`, `Calle`, `Número`, `Localidad`, `Provincia`, `Código postal` |

**No renderizar:** `Tomás Iturralde`, `30.123.456`, `20-30123456-8`, `Toyota Etios 2019`, `AB123CD`, `POL-0000042`, `$ 26.250,00`, `$ 25.000,00`, `10/11/2026` (muestras); los bloques "Cuenta", "Nueva cotización" y "Registrar pago en caja" (sección 13).

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Carga | Skeleton del encabezado (avatar circular y dos bloques de texto), dos filas de vehículo y el rail. Sin spinner de página. |
| Cliente OK | Encabezado, pestaña Vehículos activa, lista y pólizas. |
| 404 o cliente inactivo | Página "Cliente no encontrado." con "Volver a clientes". No se piden vehículos ni pólizas. |
| Error de cliente (red o 5xx) | Alerta con "Reintentar". |
| Error de vehículos o pólizas | Alerta solo en esa sección; el encabezado sigue. |
| Sin vehículos | Mensaje de §8 y botón "Agregar vehículo". |
| Sin pólizas | Mensaje de §8. |
| Póliza `Vencida` o `Cancelada` | No cuenta como activa (RN04); el vehículo muestra `Sin póliza activa` si no tiene otra. |
| Vehículo sin póliza activa | `Sin póliza activa` + `Cotizar` (enlace a `/cotizaciones/nueva?vehiculoId={id}&clienteId={clienteId}`). |
| Póliza sin cuotas pendientes | `Próx. vencimiento` = `-`. |
| Cuotas no cargadas aún | `-` mientras carga; no bloquea la tabla. |
| Vehículo sin cruce de póliza | Columna `Vehículo` de la póliza muestra `—`. |
| Enum fuera del mapa | Badge `Desconocido` (propuesta), sin crashear. |
| Cliente no validado | Badge `Pendiente` con la etiqueta `Renaper`. |
| Pestaña desconocida en `?tab=` | Cae en `vehiculos`. |
| Foco en tabs | Flechas izquierda y derecha mueven el foco; `Enter` o `Espacio` activan (patrón tablist). |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, MSW (`server.use` por caso).

| Test | Qué afirma |
|---|---|
| `muestra nombre como H1, DNI con puntos y CUIL tal cual` | Cabecera. |
| `badge Validado si validadoRenaper y Pendiente si no` | Renaper. |
| `avatar con iniciales de nombre y apellido` | Derivación. |
| `la pestaña Vehículos está activa sin ?tab=` | Default D-17. |
| `?tab=datos muestra contacto y domicilio en lectura` | Pestaña Datos (propuesta). |
| `una pestaña desconocida cae en Vehículos` | Caso borde. |
| `las flechas mueven el foco entre pestañas` | Patrón tablist. |
| `la fila de vehículo muestra título marca modelo anio, patente y tipo · uso` | Mapeo. |
| `tipo 0 y uso 0 muestran Auto · Particular` | Mapa de T-10 (sugerido). |
| `vehículo con póliza Vigente muestra su número y badge` | RN04. |
| `vehículo con póliza Pendiente o Suspendida también cuenta como activa` | RN04. |
| `vehículo con póliza solo Vencida o Cancelada muestra Sin póliza activa y Cotizar` | RN04. |
| `Cotizar enlaza a /cotizaciones/nueva con vehiculoId y clienteId` | `href`. |
| `la lista de vehículos pide clienteId y no pagina` | Request. |
| `la tabla de pólizas cruza vehículo por patente sin distinguir mayúsculas` | Join. |
| `proximaCuota devuelve la fecha de la primera cuota Pendiente` | Función pura de `api/proximaCuota.ts` (D-B07-2). |
| `reglaPolizaActiva cruza patente sin distinguir mayúsculas y espacios` | Función pura de `api/reglaPolizaActiva.ts`. |
| `póliza sin cuotas Pendiente muestra -` | Caso borde. |
| `no pide cuotas de pólizas Vencida o Cancelada` | Ahorro de requests. |
| `pólizas pide tamano=100 y clienteId` | Request. |
| `404 muestra Cliente no encontrado y no pide vehículos` | Estado. |
| `error del cliente muestra Reintentar que vuelve a pedir` | Estado de error. |
| `error de vehículos no oculta el encabezado` | Aislamiento. |
| `sin vehículos muestra el mensaje y Agregar vehículo` | Vacío. |
| `el rail solo tiene Agregar vehículo; no hay Cuenta ni pago en caja` | D-33 y sección 13. |
| `el enlace Agregar vehículo va a /clientes/{id}/vehiculos/nuevo` | `href`. |
| `no aparecen valores de muestra fijos` | Sin "Tomás" ni "AB123CD" como texto. |
| `no tiene violaciones de accesibilidad` | Helper de US-FE-T-19 (axe). |

## 11. Criterios de aceptación

1. `/clientes/:clienteId` está registrada después de `/clientes/nuevo` en `routes.tsx`.
2. La cabecera muestra nombre en H1, `DNI` con puntos, `CUIL` tal cual, y badge `Validado` o `Pendiente` con la etiqueta `Renaper`.
3. Las pestañas son `Datos` y `Vehículos`; `Vehículos` está activa sin `?tab=`.
4. La lista de vehículos pide `GET /api/vehiculos?clienteId=` y muestra título, patente, tipo · uso y validación DNRPA de cada uno.
5. Un vehículo con póliza Pendiente, Vigente o Suspendida muestra su número y badge; uno sin esas pólizas muestra `Sin póliza activa` y `Cotizar`.
6. `Cotizar` enlaza a `/cotizaciones/nueva?vehiculoId=...&clienteId=...`.
7. Debajo de la lista, la sección `Pólizas` muestra las columnas de §8 con los datos de `GET /api/polizas?clienteId=...&tamano=100`.
8. El `Próx. vencimiento` es la fecha de la primera cuota con estado `Pendiente`; si no hay, `-`; las pólizas Vencida y Cancelada no piden cuotas.
9. Un cliente 404 o inactivo muestra "Cliente no encontrado." y no pide vehículos ni pólizas.
10. Un error de cliente muestra "Reintentar"; un error de vehículos o pólizas no oculta el encabezado.
11. El rail solo tiene "Agregar vehículo"; no se muestran "Cuenta", "Nueva cotización" ni "Registrar pago en caja".
12. Los botones "Editar" y "Dar de baja" no aparecen en esta tarea (solo cuando B-08 los provee).
13. Los tests de §10 están en verde y el test de axe no tiene violaciones.
14. `npm run lint`, `typecheck`, `test` y `build` están en verde en `apps/backoffice`.

## 12. Verificación manual

Requiere `VITE_USE_MOCKS=true` (PB-03) o el back con esos endpoints.

1. Abrir la ficha de un cliente del mock. Ver nombre, DNI con puntos, CUIL y badge.
2. Ver la pestaña Vehículos activa y la lista. Revisar un vehículo con póliza y otro sin póliza.
3. Hacer clic en "Cotizar" y ver la ruta de cotización (la pantalla llega con B-10).
4. Revisar la tabla de pólizas: número, vehículo por patente, vigencia y próximo vencimiento.
5. Abrir un id inexistente y ver "Cliente no encontrado.".
6. Confirmar con la persona responsable los pasos 2 y 4 antes del PR (workflow regla 7).

## 13. Decisiones pendientes (con default)

- **D-B07-1. Pestañas (B5 D-B5-03, D-17 del INDEX y B-07 en INDEX).** Default: `Datos` y `Vehículos`; Pólizas es sección apilada debajo de Vehículos (D-17, aplicado literal); `Pagos` no se muestra porque no hay diseño. Las pestañas de B5 §2 (`pagos`, `polizas`) quedan fuera.
- **D-B07-2. "Próx. vencimiento" (B5 D-B5-04).** Default: fecha de la primera cuota con estado `Pendiente` (valor 0), por número. Con los datos del Figma da `10/11/2026` para la póliza con cuota 8 vencida y `-` para la póliza vencida. Confirmar la regla.
- **D-B07-3. Acciones del rail (B5 D-B5-09 y D-B5-13).** Default: solo "Agregar vehículo". "Nueva cotización" y "Registrar pago en caja" esperan decisión.
- **D-B07-4. Bloque Cuenta (B5 D-B5-05, D-33, PB-28).** Oculto hasta que el back publique la deuda.
- **D-B07-5. Contenido de la pestaña Datos (B5 §7 y D-B5-02).** Default: lectura de contacto y domicilio. Editar lo implementa B-08.
- **D-B07-6. Estado de póliza y RN04 (B5 D-B5-06).** Default: Pendiente, Vigente y Suspendida cuentan como activas; Vencida y Cancelada no.
- **D-B07-7. Texto de cliente no validado (B5 §7).** Default: badge `Pendiente` con la etiqueta `Renaper`.
- **D-B07-8. Pólizas de más de 100.** Default: se piden 100; si `total` es mayor, se muestra aviso `Mostrando las primeras 100 pólizas.` (propuesta). Confirmar con el back si hace falta paginar.
- **D-B07-9. Encabezado "Vehículos" en la pestaña.** Default: se agrega (no está en el diseño).

## 14. Riesgos y errores comunes

- **Un request de cuotas por cada póliza:** cuesta. Pedir solo para pólizas activas, con `enabled` y sin esperar a todas para mostrar la tabla.
- **Cruce por patente con mayúsculas o espacios:** el `patente` de póliza y el de vehículo pueden diferir en formato. Normalizar en `api/reglaPolizaActiva.ts`.
- **Enum numérico:** `tipo`, `uso`, `estado` llegan como número. Mapear con T-10. Nunca comparar contra un número escrito a mano (FC9).
- **Orden de pólizas:** el back ordena por `fechaEmision` descendente. La póliza activa es la primera que cumple RN04, no la de número mayor.
- **Iniciales:** derivar de `nombre` y `apellido`; no inventar el avatar.
- **404 e inactivo:** el back devuelve 404 para clientes dados de baja. No mostrar datos viejos de caché para ellos.
- **Pestañas sin `?tab=` en el enlace de vuelta:** el estado de la pestaña debe vivir en la URL para que recargar no cambie la vista.
- **Sección de pólizas dentro de la pestaña Vehículos:** si se oculta la pestaña, la sección también. Verificar el test de D-17.

## 15. Definición de terminado

- `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde en `apps/backoffice`.
- Sin secretos ni credenciales en el código.
- Accesibilidad revisada con el helper de US-FE-T-19 en `/clientes/:clienteId`.
- Sin datos de muestra fijos, sin `any`, sin formateo manual de DNI, fechas ni importes.
- Criterios de §11 tildados con evidencia observada.

## 16. Observaciones al índice

- Resuelto (triage final, default de la ficha): ubicación de componentes. B5 §4 pone `VehiculoFila` en `features/vehiculos` y `PolizasTabla` en `features/polizas`; aquí se ubican en `features/clientes/components/`. Motivo: no figura en REVISION.md ni en FB8.
- Resuelto (RV-04): la fila del INDEX suma T-10 y T-11 a las dependencias de B-07.
- ABIERTO: límite de 100 pólizas (D-B07-8). Motivo: no figura en REVISION.md ni en FB8.
- ABIERTO: costo de la próxima cuota (una query por póliza activa, N+1). Motivo: no figura en REVISION.md ni en FB8; el campo `proximoVencimiento` no está pedido en PB.
- Resuelto (RV-35): la pestaña es Vehículos y Pólizas es sección apilada (D-17); el INDEX ya lo refleja en la fila de B-07.
- Resuelto (triage final, default de la ficha): contrato del puente con B-08 (`onEditar` y `onDarDeBaja`). Motivo: no figura en REVISION.md ni en FB8.

