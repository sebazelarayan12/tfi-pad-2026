# US-FE-B-08: Ficha de cliente: editar contacto y domicilio, dar de baja y reintentar Renaper

Tipo: B · Oleada: 6 · Tamaño: M · Rama sugerida: `feature/US-FE-B-08-ficha-editar-baja` · Tarjeta Trello: `US-FE-B-08`

Pantalla: [B5 Ficha de cliente](../pantallas/B5-ficha-cliente.md). Índice: [INDEX](INDEX.md), fila US-FE-B-08.

---

## 1. Objetivo

Desde la ficha de un cliente (B-07), el empleado o el administrador puede: editar el email, el teléfono y el domicilio con `PUT /api/clientes/{id}`; dar de baja lógica al cliente con `DELETE /api/clientes/{id}` tras confirmar en un diálogo; y, si el cliente quedó sin validar en Renaper, reintentar la validación con `POST /api/clientes/{id}/validar-renaper`. Para: empleados y administradores.

## 2. Alcance

**Entra**
- Botón `Editar` y diálogo modal `EditarContactoDomicilio` (formulario de contacto y domicilio).
- Botón `Dar de baja` y diálogo `role="alertdialog"` `ConfirmarBajaCliente` con foco inicial en "Cancelar".
- Botón `Validar en Renaper` junto al badge `Pendiente` (solo si `validadoRenaper` es `false`).
- Mutaciones con `retry: 0`, botón deshabilitado mientras corren y sin reenvío ante error de red (FC11).
- Wiring en `FichaClientePage` (dueño B-07): pasa `onEditar`, `onDarDeBaja` y el reintento a la cabecera.

**NO entra**
- Alta de cliente y su formulario: **US-FE-B-05**. Esta tarea no reutiliza su componente de formulario, solo el catálogo de provincias (sección 16).
- Modificar DNI, nombre, apellido, CUIL, fecha de nacimiento y sexo: el back no los acepta (US-F1-06, regla de PUT). No se muestran.
- Cancelar la póliza al dar de baja: no existe en el back (D-15 del índice).
- Pantalla de cuotas, cuenta o pago en caja: fuera del alcance (B5 D-B5-05, D-B5-13).
- Requests y tipos de `PUT`, `DELETE` (T-24) y `POST validar-renaper` (T-25); mocks de cliente (T-24).

## 3. Dependencias

- **Oleada:** 6.
- **Depende de:** US-FE-B-05, US-FE-B-07, US-FE-T-04, US-FE-T-05, US-FE-T-07, US-FE-T-10, US-FE-T-11, US-FE-T-19, US-FE-T-24, US-FE-T-25.
- **Puede empezar sin esperar a:** ninguna.
- **Bloqueada por pedidos al back:** PB-03 (MSW; `PUT` y `DELETE` están Especificados y usan el mock de T-24).

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (feature `clientes`), FB4 (formato de datos), FB7.7, FB7.9 (mutaciones sensibles), FB7.11.
- `docs/frontend/pantallas/B5-ficha-cliente.md`: §3 (botones del encabezado, medidas), §4 (`Button` variante de peligro, propuesta), §5 (textos de Editar y Dar de baja), §7 (estados de deshabilitado y de éxito), §8 (acciones "Editar" y "Dar de baja"), §9 (`PUT`, `DELETE`, `validar-renaper`), §10 (RN01, RN02, RN15), §12 (`alertdialog` con foco en Cancelar), §13 (D-B5-02, D-B5-08, D-B5-10).
- `docs/frontend/pantallas/B4-nuevo-cliente.md`: §6 (reglas de email, teléfono, domicilio, copy de error) y §9 (`validar-renaper` en tabla de respuestas).
- `docs/frontend/contratos-api/seguridad-clientes-publico.md`: §3.2 (`validar-renaper`: status y `detail`), §3.4 (`PUT`, `DELETE`, reglas de la spec: email único, sin cambio de DNI, baja lógica), §1.2 (formas de error).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §3.3 y §3.4 (formas de error por campo y de negocio).
- `docs/frontend/design-system.md`: §5.1 (Button Ghost, Secondary M), §5.2 (Input), §5.3 (Select), §8.2 y §8.3 (foco).
- `docs/frontend/pedidos-al-back.md`: PB-03 (contrato propuesto de PUT y DELETE), PB-14, PB-15.
- `docs/frontend/tareas/INDEX.md`: FC11 (mutaciones sensibles), FC10 (errores), FC16 (accesibilidad), sección de decisiones D-15 y D-33.

## 5. Archivos a crear o modificar

Bajo `frontend/apps/backoffice/src/features/clientes/`:

| Archivo | Dueño | Notas |
|---|---|---|
| `Dialogo` de `@nexa/ui` | US-FE-T-07 (RV-D05) | No se crea aquí. Se importa `Dialogo` (`role="dialog"` o `alertdialog`, Escape, foco inicial y devolución de foco). |
| `components/EditarContactoDomicilio.tsx` | US-FE-B-08 | Formulario de contacto y domicilio dentro de `Dialogo` de `@nexa/ui`. |
| `components/ConfirmarBajaCliente.tsx` | US-FE-B-08 | `alertdialog` de baja. |
| `components/ReintentarRenaperBoton.tsx` | US-FE-B-08 | Botón y mensaje junto al badge `Pendiente`. |
| `schemas/modificacionClienteSchema.ts` | US-FE-B-08 | Esquema zod propio (no reutiliza B-05). |
| `api/useModificarCliente.ts` | US-FE-B-08 | `useMutation` con `retry: 0`. |
| `api/useDarDeBajaCliente.ts` | US-FE-B-08 | `useMutation` con `retry: 0`. |
| `api/useReintentarValidacionRenaper.ts` | US-FE-B-08 | `useMutation` con `retry: 0`; al éxito actualiza el detalle en caché. |
| `pages/FichaClientePage.tsx` | US-FE-B-07 | **Modificación**: pasa los callbacks y el reintento a la cabecera; redirige tras baja. |
| `components/ClienteEncabezado.tsx` | US-FE-B-07 | **Modificación**: muestra los botones Editar y Dar de baja solo si llegan los callbacks. |
| `components/*.test.tsx`, `api/*.test.ts`, `pages/FichaClientePage.test.tsx` | US-FE-B-08 | Tests de §10. |

Compartidos (no editar): `packages/api/**` (T-24, T-25), `packages/ui/**`, `app/**`.

## 6. Pasos de implementación

1. Confirmar que B-05, B-07, T-04, T-05, T-07, T-10, T-11, T-19, T-24 y T-25 están mergeadas. Leer las funciones de `PUT`, `DELETE` y `validar-renaper` y sus keys (los nombres de §7 son sugeridos).
2. Crear `modificacionClienteSchema.ts` con las reglas de §9 (email trim y formato, máximo 150; teléfono máximo 20 y opcional; calle máximo 150; número máximo 20; localidad máximo 100; provincia de la lista; código postal máximo 10).
3. Usar `Dialogo` de `@nexa/ui` (T-07, RV-D05; no se crea un diálogo propio). Comportamiento esperado: al abrir, el foco va al primer elemento interactivo (o a "Cancelar" en `alertdialog`); Escape cierra; el foco vuelve al botón que lo abrió; `aria-modal="true"`; `aria-labelledby` con el título.
4. `EditarContactoDomicilio`: valores iniciales desde `useCliente`. Dos secciones: `Contacto` (Email, Teléfono) y `Domicilio` (Calle, Número, Localidad, Provincia, Código postal). Botones "Cancelar" y "Guardar cambios" (copy propuesto, sección 8).
5. `useModificarCliente`: `PUT /api/clientes/{id}` con `ClienteModificacionRequest`. Al éxito: `setQueryData` con la respuesta si es `ClienteResponse`, e invalidar `clientesKeys.lista` y el detalle. Si el cuerpo no trae el cliente completo, invalidar y refetch.
6. Errores de `PUT`: 400 con `detail` (por ejemplo, email de otro cliente) → alerta dentro del diálogo con el texto sin prefijo RN; los datos se conservan; no se marca campo. 404 → "Cliente no encontrado." y se cierra el diálogo con aviso en la ficha. 5xx o red → alerta genérica.
7. `ConfirmarBajaCliente`: título, texto y dos botones (sección 8). "Cancelar" tiene el foco inicial. "Dar de baja" envía `DELETE` una sola vez.
8. `useDarDeBajaCliente` (`retry: 0`): al 204, invalidar `clientesKeys.lista` y navegar a `/clientes` con `state: { aviso: { tipo: 'exito', texto: 'Cliente dado de baja.' } }` (RV-41). Errores: 400 con `detail` en el diálogo (D-15); 404 → "Cliente no encontrado." y navegar a `/clientes`; 5xx → alerta genérica.
9. `ReintentarRenaperBoton`: visible solo si `validadoRenaper === false`. Al clic llama a `validar-renaper` (sin body). 200 → actualiza el detalle a `validadoRenaper: true` y muestra el aviso (sección 8). Errores según §9.
10. `FichaClientePage` (B-07): pasa `onEditar` y `onDarDeBaja` a `ClienteEncabezado` y el reintento al rail o al encabezado.
11. Escribir los tests de §10 antes de los componentes; correr `lint`, `typecheck`, `test`, `build`.

## 7. Contrato con el back

| Método y ruta | Estado | Request | Response | Errores |
|---|---|---|---|---|
| `PUT /api/clientes/{id}` | Especificado (PB-03; mock de T-24) | `ClienteModificacionRequest` | 200 `ClienteResponse` (propuesta de PB-03; la spec no la define) | 400 con `detail` (email en uso, por ejemplo); 404; 401; 403 |
| `DELETE /api/clientes/{id}` | Especificado (US-F1-06; mock de T-24) | sin body | 204 sin cuerpo | 400 con `detail` si la baja se bloquea (decisión pendiente); 404; 401; 403 |
| `POST /api/clientes/{id}/validar-renaper` | En PR #50 (mock de T-25) | sin body | 200 `ClienteResponse` | 400 con `detail` (no figura, fallecido, menor); 404 con `codigo: "CLIENTE_NO_ENCONTRADO"`; 502; 401; 403 |

```ts
// Tipos en @nexa/api (dueño US-FE-T-24 para PUT y DELETE; US-FE-T-25 para validar-renaper)
export interface ClienteModificacionRequest {
  email: string;             // único entre clientes (RN01)
  telefono?: string | null;  // máx. 20
  calle: string;             // máx. 150
  numero: string;            // máx. 20
  localidad: string;         // máx. 100
  provincia: string;         // máx. 100
  codigoPostal: string;      // máx. 10
}
// Respuesta de PUT: ClienteResponse (propuesta; ver sección 16).
// Respuesta de DELETE: sin cuerpo (204).
// Respuesta de validar-renaper: ClienteResponse con validadoRenaper=true y fechaValidacionRenaper en UTC.
```

- DNI, nombre, apellido, CUIL, fecha y sexo no se envían en `PUT` (la spec lo prohíbe).
- Los `detail` de negocio se muestran sin prefijo `RN01:` ni `RN02:` (FC10).
- Handlers MSW: **No aplica** (T-24 y T-25). Las pruebas de error usan `server.use`.
- Keys: `clientesKeys.detalle(id)` y `clientesKeys.lista(filtro)` de T-24.
- PB-14 (degrada): los 400 de negocio llegan sin código; se muestran como texto, sin marcar campos.
- PB-15 (degrada): los errores de validación de modelo llegan en inglés; se usa copy propio.

## 8. Contenido de UI

Textos de B5 §5 y §8, y copy propuesto (marcado) para lo que el diseño no define.

| Zona | Texto |
|---|---|
| Botón editar | `Editar` (con icono `pencil-simple`) |
| Botón baja | `Dar de baja` (variante de peligro sin fondo; propuesta: Ghost con color `status/cancelada/text`, B5 D-B5-08) |
| Título del diálogo de edición (propuesta) | `Editar contacto y domicilio` |
| Secciones (propuesta) | `Contacto` · `Domicilio` |
| Labels | `Email` · `Teléfono` · `Calle` · `Número` · `Localidad` · `Provincia` · `Código postal` |
| Acciones de edición (propuesta) | `Cancelar` · `Guardar cambios` |
| Aviso de edición guardada (propuesta) | `Datos actualizados.` |
| Título de baja (propuesta) | `¿Dar de baja a {nombre}?` |
| Texto de baja (propuesta; RN15) | `El cliente deja de aparecer en el listado. Sus datos se conservan.` |
| Acciones de baja (propuesta) | `Cancelar` (foco inicial) · `Dar de baja` |
| Aviso tras baja (propuesta) | `Cliente dado de baja.` |
| Botón Renaper (propuesta) | `Validar en Renaper` |
| Aviso tras validar (propuesta) | `Cliente validado en Renaper.` |
| Renaper no responde (propuesta) | `Renaper no responde. Probá de nuevo más tarde.` |
| Error general de guardado (propuesta) | `No pudimos guardar los cambios. Probá de nuevo.` |
| Error general de baja (propuesta) | `No pudimos dar de baja al cliente. Probá de nuevo.` |
| Cliente no encontrado (propuesta) | `Cliente no encontrado.` |
| Texto de error de email (propuesta) | `El email no tiene un formato válido.` · `Ingresá el email.` |
| Provincias (lista fija, igual que B-05, en este orden) | Buenos Aires, Catamarca, Chaco, Chubut, Ciudad Autónoma de Buenos Aires, Córdoba, Corrientes, Entre Ríos, Formosa, Jujuy, La Pampa, La Rioja, Mendoza, Misiones, Neuquén, Río Negro, Salta, San Juan, San Luis, Santa Cruz, Santa Fe, Santiago del Estero, Tierra del Fuego, Tucumán |

**No renderizar:** los valores de muestra (`Tomás Iturralde`, `30.123.456`, `tomas.iturralde@gmail.com`). El nombre en el título de la baja sale del cliente cargado.

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Edición: valores iniciales | Vienen de `useCliente`; el formulario no se reinicia si el detalle se refresca mientras está abierto. |
| Edición: campo inválido | Mensaje debajo del campo; sin llamada a la API. |
| Edición: guardando | Botones y campos deshabilitados; `aria-busy` en "Guardar cambios"; un solo `PUT`. |
| Edición: 200 | Cierra el diálogo, actualiza la cabecera y muestra "Datos actualizados.". |
| Edición: 400 `detail` | Alerta dentro del diálogo; datos conservados; no marca campos. |
| Edición: 404 | "Cliente no encontrado." y cierra el diálogo. |
| Baja: foco inicial | En "Cancelar". |
| Baja: Escape | Cierra sin enviar. |
| Baja: confirmar | Un solo `DELETE`; botón deshabilitado durante la mutación. |
| Baja: 204 | Navega a `/clientes` con el aviso. |
| Baja: 400 `detail` | Texto del back dentro del diálogo; el diálogo queda abierto (D-15). |
| Baja: 404 | "Cliente no encontrado." y navegación a `/clientes`. |
| Baja: red o 5xx | Alerta genérica; sin reintento automático. |
| Reintento: visible | Solo si `validadoRenaper` es `false`. |
| Reintento: 200 | Badge pasa a `Validado`; aviso de éxito. |
| Reintento: 400 `detail` | Texto del back en el lugar del botón. |
| Reintento: 404 | "Cliente no encontrado." |
| Reintento: 502 o red | "Renaper no responde. Probá de nuevo más tarde." |
| Reintento: en curso | Botón deshabilitado con `aria-busy`. |
| 401 | Lo maneja T-08. |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, MSW (`server.use` por caso).

| Test | Qué afirma |
|---|---|
| `Editar abre el diálogo con email, teléfono y domicilio precargados` | Valores iniciales. |
| `el diálogo no muestra DNI, nombre, apellido, CUIL, fecha ni sexo` | Regla de PUT. |
| `email inválido no llama a la API y muestra su mensaje` | Validación. |
| `codigoPostal de más de 10 caracteres es inválido` | Límite. |
| `el PUT envía exactamente los siete campos de ClienteModificacionRequest` | Body. |
| `200 cierra el diálogo, actualiza el encabezado y muestra "Datos actualizados."` | Éxito. |
| `400 con detail muestra el texto sin prefijo RN y deja el diálogo abierto` | FC10 y D-15. |
| `400 con detail no marca ningún campo` | FC10. |
| `404 en PUT muestra "Cliente no encontrado."` | Estado. |
| `doble clic en Guardar cambios envía un solo PUT` | FC11. |
| `Dar de baja abre alertdialog con foco en Cancelar` | Accesibilidad. |
| `Escape cierra la baja sin enviar DELETE` | Caso borde. |
| `confirmar envía un solo DELETE` | FC11. |
| `204 navega a /clientes con aviso "Cliente dado de baja."` | Éxito. |
| `400 en DELETE muestra el detail y el diálogo sigue abierto` | D-15. |
| `404 en DELETE navega a /clientes con "Cliente no encontrado."` | Estado. |
| `5xx en DELETE muestra la alerta genérica y no reintenta` | FC11. |
| `Validar en Renaper solo aparece si validadoRenaper es false` | Regla de visibilidad. |
| `200 de validar-renaper cambia el badge a Validado` | Actualización de caché. |
| `400 de validar-renaper muestra el detail` | Estado. |
| `502 de validar-renaper muestra el mensaje de Renaper caído` | Estado. |
| `error de red en validar-renaper no reintenta` | `HttpResponse.error()` y un solo request. |
| `durante la validación el botón está deshabilitado con aria-busy` | Carga. |
| `el diálogo de baja y de edición no tienen violaciones de accesibilidad` | Helper de US-FE-T-19 (axe). |

## 11. Criterios de aceptación

1. "Editar" abre el diálogo con email, teléfono, calle, número, localidad, provincia y código postal precargados.
2. El diálogo no permite cambiar DNI, nombre, apellido, CUIL, fecha de nacimiento ni sexo.
3. El `PUT` envía exactamente los campos de `ClienteModificacionRequest`, con un solo envío aunque haya doble clic.
4. 200 cierra el diálogo, actualiza la cabecera y muestra "Datos actualizados.".
5. 400 con `detail` muestra el texto sin prefijo `RNxx:`, deja el diálogo abierto y no marca campos.
6. 404 en el `PUT` muestra "Cliente no encontrado.".
7. "Dar de baja" abre un `alertdialog` con foco inicial en "Cancelar" y Escape lo cierra sin enviar nada.
8. Confirmar la baja envía un solo `DELETE`.
9. 204 navega a `/clientes` con el aviso "Cliente dado de baja.".
10. 400 en `DELETE` muestra el `detail` dentro del diálogo y no navega.
11. 5xx y red en `DELETE` muestran la alerta genérica sin reintento automático.
12. "Validar en Renaper" aparece solo con `validadoRenaper` en `false`.
13. 200 de `validar-renaper` actualiza el badge a `Validado` y muestra el aviso.
14. 400, 404, 502 y red de `validar-renaper` tienen el texto de §8 y no reintentan.
15. Ninguna mutación usa reintento automático (`retry: 0`).
16. Los tests de §10 están en verde y el test de axe no tiene violaciones.
17. `npm run lint`, `typecheck`, `test` y `build` están en verde en `apps/backoffice`.

## 12. Verificación manual

Requiere `VITE_USE_MOCKS=true` (PB-03, PB-14) o el back con esos endpoints.

1. Abrir la ficha de un cliente. Pulsar "Editar", cambiar el teléfono y guardar. Ver el aviso y el teléfono nuevo en la cabecera.
2. Intentar un email que use otro cliente. Ver el mensaje del back sin prefijo y el diálogo abierto.
3. Pulsar "Dar de baja". Ver el foco en "Cancelar". Pulsar Escape y comprobar que no pasó nada.
4. Confirmar la baja. Ver `/clientes` con el aviso y el cliente fuera del listado.
5. Abrir un cliente con badge `Pendiente`, pulsar "Validar en Renaper" y ver el cambio a `Validado` (o el mensaje de Renaper caído).
6. Confirmar con la persona responsable los pasos 1 a 5 antes del PR (workflow regla 7).

## 13. Decisiones pendientes (con default)

- **D-B08-1. Destino de Editar (B5 D-B5-02).** Default: diálogo modal con contacto y domicilio (opción a). Alternativa: reutilizar el alta en modo edición; se descarta porque mezcla flujos.
- **D-B08-2. Baja con pólizas activas (B5 D-B5-08, spec US-F1-06).** Default: se envía `DELETE` y se muestra el `detail` del 400 que devuelva el back (D-15 del índice). La spec propone bloquear; el diseño no decide. Confirmar. Si el back bloquea, la UI no cambia.
- **D-B08-3. Confirmación de la baja (B5 §7, sin diseño).** Default: el texto de §8 (propuesta).
- **D-B08-4. Variante de peligro del botón (B5 D-B5-08).** Default: Ghost con color `status/cancelada/text`.
- **D-B08-5. Respuesta de PUT.** Default: se espera `ClienteResponse`; si no llega, se invalida y se vuelve a pedir el detalle.
- **D-B08-6. Aviso de baja en el listado.** Default: el aviso viaja en `location.state.aviso` (RV-41, misma clave que B-04 y B-05).
- **D-B08-7. Reintento de Renaper desde la ficha.** Default: se ofrece solo con `validadoRenaper` en `false`, como en B5 §7 y el INDEX de B-08.
- **D-B08-8. Diálogo.** Default: `Dialogo` de `@nexa/ui` (T-07, RV-D05; D-37 del INDEX).

## 14. Riesgos y errores comunes

- **Enviar campos que el back no acepta:** un `PUT` con DNI o nombre se rechaza o ignora. Enviar solo `ClienteModificacionRequest`.
- **Marcar campos por texto del back:** el `detail` no tiene campo. Mostrarlo como texto.
- **Doble envío de baja:** un segundo `DELETE` da 404 y confunde al usuario. Un solo envío, `retry: 0`.
- **Foco de diálogo sin devolver:** al cerrar, el foco debe volver al botón que abrió el diálogo.
- **Cache desactualizada:** tras `PUT` o baja, invalidar lista y detalle (FC2), o el listado muestra datos viejos.
- **Escape con mutación en curso:** no debe cancelar la petición ni mostrar un estado falso; cerrar solo si no hay mutación.
- **Renaper lento:** el botón queda en carga. El timeout lo define T-25 (D-25-2, RV-38).

## 15. Definición de terminado

- `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde en `apps/backoffice`.
- Sin secretos ni credenciales en el código.
- Accesibilidad revisada con el helper de US-FE-T-19 en la ficha y en los dos diálogos.
- Sin datos de muestra fijos, sin `any`, sin reintento automático en mutaciones.
- Criterios de §11 tildados con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-10): la lista de provincias es de B-05 (`features/clientes/schemas/provincias.ts`); B-08 declara B-05 en sus dependencias.
- Resuelto (RV-40): las dependencias de B-08 incluyen T-04, T-05, T-07, T-10, T-11, T-19 y B-05.
- Resuelto (RV-D05): el diálogo es `Dialogo` de `@nexa/ui` (T-07), no un primitivo propio de B-05.
- Resuelto (RV-41): la clave del aviso es `location.state.aviso` en B-04, B-05 y B-08.
- Resuelto (RV-38): el reintento de Renaper `POST .../validar-renaper` vive en esta ficha; el INDEX lo asigna a B-08.
- ABIERTO: respuesta de `PUT`. La spec no define el cuerpo (B5 y PB-03 lo proponen). Motivo: no figura en REVISION.md ni en FB8.

