# W1 Inicio (web pública)

Estado de la especificación: borrador para el equipo de front. Fuente visual: Figma (nodo 18:201). Fuente de contrato: código del back (`backend/Aseguradora.Api/Controllers`, `backend/Aseguradora.Application/Dtos`), `docs/AnalisisBack.md` §3, §4 y §7, y `docs/tareas-divididas.md`. Reglas de `00-decisiones-base.md` aplican (TypeScript estricto, TanStack Query para datos del servidor, tokens `--nexa-*`).

## 1. Propósito y quién la usa

- Página de entrada de la web pública (`apps/web-publica`). La usa cualquier cliente de la aseguradora **sin login** (CU02, CU15, CU20 en `AnalisisBack.md` §3).
- Objetivos de la pantalla: (a) llevar a la consulta de póliza (W2) con el CTA principal; (b) mostrar los planes de cobertura de referencia; (c) explicar cómo pagar (online o en efectivo con Pago Fácil).
- No tiene formularios ni escribe datos.

## 2. Ruta propuesta y guardas de acceso

- Ruta propuesta: `/` (app `web-publica`). PROPUESTA, no está en el Figma.
- Guardas: ninguna. Es pública. No requiere sesión ni JWT. No debe leer ni guardar datos del usuario.
- Destinos de navegación (ver sección 8): `/consultar-poliza` (W2).

## 3. Estructura visual (de arriba a abajo)

Medidas desktop, frame 1440 px de ancho. Alto de la captura de referencia: 1701 px. Nota: el div de fondo (`Backdrop`) está declarado con 1834 px de alto en el código de referencia. Ver sección 13.

Contenedor de página:
- `Backdrop` (nodo 18:202): gradiente lineal de 128.14° de `rgb(238,242,184)` (0%) a `rgb(213,221,227)` (100%), posición absoluta 0,0, 1440 px de ancho.
- `Shell` (nodo 18:203): fondo `--nexa-surface-panel` (#FFFFFF), radio `--nexa-radius-shell` (24 px), sombra `Nexa/Shadow/Shell` (0 24 60 rgba(60,70,40,0.10)), padding 24 px, ancho 1392 px (1440 menos 24 de margen a cada lado). Es el único elemento con sombra.

Regiones dentro del Shell, en orden vertical:

1. **Barra de navegación `PublicNav`** (nodo 14:179). Alto 72 px. Padding horizontal 24 px. Gap 32 px.
   - Izquierda: `Logo/Nexa` (nodo 14:5). Marca de 28×28 px con radio 12 px, fondo `--nexa-action-primary` (#17191C), letra "N" blanca en Bold 16 px. Al lado, el texto "Nexa Seguros" en SemiBold 16/22.
   - Espaciador flexible (nodo 14:184).
   - "Planes" y "Contacto": texto Regular 14/20, color `--nexa-text-secondary` (#5C6066).
   - Botón `Button` Primary, size M, label "Consultar póliza" (40 px de alto, padding horizontal 16 px, pill).

2. **Hero** (nodo 18:214). Padding vertical 48 px. Dos columnas con gap 48 px, alineadas al centro vertical.
   - Columna izquierda "Hero copy" (nodo 18:343), flex 1, gap 24 px:
     - Título: "Tu vehículo asegurado, tu póliza siempre a mano." (Nexa/Display: Plus Jakarta Sans Bold 40/44, color `--nexa-text-primary`). Ocupa 2 líneas en el Figma.
     - Bajada: "Consultá el estado de tu póliza, revisá tus cuotas y pagalas online o en efectivo." (Regular 16/20, color `--nexa-text-secondary`; el Figma no le asigna un estilo con nombre).
     - Fila de CTAs (nodo 18:346), gap 12 px: botón Primary "Consultar póliza" y botón Secondary "Ver planes" (borde 1 px `--nexa-border-strong` #D3D5CE, fondo `--nexa-surface-panel`).
   - Columna derecha "IMG auto y moto 560x420" (nodo 18:351): contenedor de 560×420 px, radio `--nexa-radius-card` (16 px), fondo `--nexa-surface-subtle` (#F1F2EE), contenido centrado. Dentro hay sólo el texto "Foto: auto y moto" (Caption 11/14 Medium, color `--nexa-text-tertiary`). Ver sección 4 y 13: es un marcador de imagen, no una imagen.

3. **Divider** (nodo 18:215): línea horizontal de 1 px, color `--nexa-border-hairline` (#E7E8E3), ancho completo.

4. **Sección Planes** (nodo 18:216). Padding vertical 48 px, gap 24 px.
   - Encabezado "Planes header" (nodo 18:513), `justify-between`:
     - Izquierda "Planes title" (nodo 18:514), gap 8 px: título "Planes" (H2 20/26 SemiBold, color `--nexa-text-primary`) y subtítulo "Cobertura de referencia para autos, motos y camionetas." (Body-sm 13/18, color `--nexa-text-secondary`).
     - Derecha: `Chip` tipo Neutro (nodo 11:126) con label "Valores de referencia" (28 px de alto, pill, fondo `--nexa-surface-subtle`, texto Label 12/16 Medium `--nexa-text-secondary`).
   - Tabla "Tabla planes" (nodo 18:519): borde 1 px `--nexa-border-hairline`, radio 16 px, `overflow` oculto. Ancho completo del Shell interior (1344 px).
     - **Fila encabezado** (nodo 18:520): fondo `--nexa-surface-subtle` (#F1F2EE), alto 160 px, padding 24 px.
       - Columna "Celda cobertura" (nodo 18:521), ancho 694 px. Texto "Cobertura" (Label 12/16 Medium, color `--nexa-text-tertiary`), alineado arriba.
       - Columna "Plan RC" (nodo 18:523), ancho 200 px, gap 4 px: "RC" (H3 16/22 SemiBold), "Responsabilidad Civil" (Body-sm 13/18, secundario), "desde" (Caption 11/14, tertiary), precio "$ 10.000,00" (Mono-lg JetBrains Mono Medium 22/28, primario), "por mes" (Caption 11/14, tertiary).
       - Columna "Plan TC" (nodo 18:529), ancho 200 px, alto 112 px: "TC", "Terceros Completo", "desde", "$ 18.000,00", "por mes". Esta columna tiene un resaltado vertical (ver abajo).
       - Columna "Plan TR" (nodo 18:535), ancho 200 px: "TR", "Todo Riesgo", "desde", "$ 27.500,00", "por mes".
       - Resaltado "Plan TC highlight" (nodo 35:47): rectángulo absoluto de 200×160 px, `left: 918 px`, `top: 0`, fondo `--nexa-accent-lime-soft` (#F3F7C9). Cubre sólo la banda del encabezado. Las filas tienen su propio fondo lime en la celda TC (nodos 18:548, 18:560 y 18:572). Es el único destacado de la tabla.
     - Divider (nodo 18:541).
     - **Fila 1 "Responsabilidad civil a terceros"** (nodo 18:542): alto aprox. 52 px (padding 16 px vertical, 24 px horizontal), columnas: texto de cobertura (flex 1, Body 14/20, primario), celda RC (200 px, centrada), celda TC (200 px, fondo lime, alto 52 px, centrada), celda TR (200 px, centrada).
     - Divider (nodo 18:554).
     - **Fila 2 "Robo e incendio total"** (nodo 18:555): mismas columnas.
     - Divider (nodo 18:566).
     - **Fila 3 "Daños por choque al vehículo"** (nodo 18:567): mismas columnas.
   - Nota al pie "La prima final depende del vehículo y se informa al cotizar." (Body-sm 13/18, color `--nexa-text-tertiary`).

5. **Divider** (nodo 18:217).

6. **Sección "Cómo pagar"** (nodo 18:218). Padding vertical 48 px, gap 24 px.
   - Título "Cómo pagar" (H2 20/26 SemiBold, primario).
   - Fila "Medios de pago" (nodo 18:611), gap 24 px, dos tarjetas de igual ancho (flex 1):
     - Tarjeta A "Card/Widget" (nodo 34:1566): fondo `--nexa-surface-panel`, borde 1 px `--nexa-border-hairline`, radio 16 px, padding 20 px, gap 16 px.
       - Header (nodo 34:1567), gap 8 px: icono `icon/credit-card` 20 px; título "Pago online" (H3 16/22 SemiBold); espaciador; acción: icono `icon/arrow-up-right` 16 px + texto "Consultar póliza" (Label 12/16 Medium).
       - Texto: "Elegí Pasarela A o Pasarela B y pagá con tarjeta o dinero en cuenta." (Body-sm 13/18, secundario).
     - Tarjeta B "Card/Widget" (nodo 34:1577): misma estructura. Icono `icon/barcode` 20 px; título "Efectivo con Pago Fácil"; acción con `icon/arrow-up-right` 16 px y texto "Ver ejemplo de cupón"; texto "Pagá en efectivo con el cupón de Pago Fácil, que tiene un código de barras de 42 dígitos."

7. **Footer `PublicFooter`** (nodo 14:189). Fondo `--nexa-surface-sidebar` (#F5F5F2), radio 16 px, padding 32 px vertical y 40 px horizontal, gap 24 px.
   - Fila "Contact" (nodo 14:190), gap 48 px, cuatro columnas de contenido (alto de cada una: etiqueta + valor, gap 4 px).
   - Copyright al pie (Caption 11/14, tertiary).

Ancho del Shell interior en el Figma: contenido de 1344 px (1392 menos padding 24 a cada lado).

## 4. Componentes del design system que usa (nombres del Figma) y componentes propios

Componentes del design system (de la página `00 Fundamentos` / componentes del archivo):

| Nombre en Figma | Nodo | Uso en W1 | Notas de la descripción de Figma |
|---|---|---|---|
| `Logo/Nexa` | 14:5 | Nav y marca | "Nexa monogram plus wordmark. The only hand-made brand mark." |
| `Button` (Primary, size M) | 11:42 | Nav "Consultar póliza", hero "Consultar póliza" | "Primary for the main action of a screen, Secondary for alternatives, Ghost for inline actions. Size M is 40px high, S is 32px high." |
| `Button` (Secondary, size M) | 11:42 | Hero "Ver planes" | Igual que arriba. |
| `Chip` (Neutro) | 11:126 | "Valores de referencia" | "Destacado (lime) marks the one thing that matters on a widget. Neutro is informational." |
| `Card/Widget` | 34:1566 y 34:1577 | Tarjetas "Pago online" y "Efectivo con Pago Fácil" | No tiene descripción en el Figma. |
| `Badge/Estado` | 11:117 | No se usa en W1 | |
| `Shell` | 15:104 | Contenedor blanco flotante | "Floating white app shell: 24px radius, only element with a drop shadow (Nexa/Shadow/Shell). Sits 24px inside the Backdrop." |
| `Backdrop` | 15:102 (en W2/W3) y 18:202 (en W1) | Fondo degradado | |
| `PublicFooter` | 14:189 | Pie | |
| `PublicNav` | 14:179 | Barra superior | |
| Íconos | `icon/check` (nodos 18:546, 18:549, 18:552, 18:561, 18:564, 18:575), `icon/credit-card` (34:1575), `icon/barcode` (34:1586), `icon/arrow-up-right` (34:1571, 34:1582) | Tabla, tarjetas | Son imágenes SVG; ver regla de assets en el skill de Figma: usar el SVG descargado, respetar ancho/alto raíz. |

Componentes propios de la pantalla (no están en el design system; el equipo los implementa dentro de `features/` o en `app/`):
- `HeroPublico` (copy + imagen placeholder + CTAs).
- `TablaPlanes` (encabezado de planes, filas de cobertura, columna destacada TC). Nombre de dominio: `planes`. Ver sección 9.
- `MedioDePagoCard` (dos tarjetas de "Cómo pagar"). Se reutiliza en W4 si aplica (decisión del equipo).
- `PiePublico` ya está en `@nexa/ui` como `PublicFooter` (verificar que exista en `packages/ui`).

Regla de código: el skill de Figma indica que el código de referencia usa Tailwind; el proyecto usa tokens propios. Los valores van como tokens (`--nexa-*`) del preset compartido. No se usan estilos inline para valores de diseño.

## 5. Contenido textual literal

Todos los textos se copian del Figma, con tildes y puntuación.

| Ubicación | Texto literal | Tipo |
|---|---|---|
| Nav, logo | `Nexa Seguros` | Marca |
| Nav, marca | `N` | Marca (monograma) |
| Nav | `Planes` | Link |
| Nav | `Contacto` | Link |
| Nav | `Consultar póliza` | Botón |
| Hero, título | `Tu vehículo asegurado, tu póliza siempre a mano.` | Título |
| Hero, bajada | `Consultá el estado de tu póliza, revisá tus cuotas y pagalas online o en efectivo.` | Texto |
| Hero, CTA | `Consultar póliza` | Botón Primary |
| Hero, CTA | `Ver planes` | Botón Secondary |
| Hero, imagen | `Foto: auto y moto` | Marcador (ver sección 13) |
| Planes, título | `Planes` | Título de sección |
| Planes, subtítulo | `Cobertura de referencia para autos, motos y camionetas.` | Texto |
| Planes, chip | `Valores de referencia` | Chip |
| Tabla, cabecera columna 1 | `Cobertura` | Encabezado |
| Plan RC | `RC` / `Responsabilidad Civil` / `desde` / `$ 10.000,00` / `por mes` | Datos |
| Plan TC | `TC` / `Terceros Completo` / `desde` / `$ 18.000,00` / `por mes` | Datos |
| Plan TR | `TR` / `Todo Riesgo` / `desde` / `$ 27.500,00` / `por mes` | Datos |
| Fila 1 | `Responsabilidad civil a terceros` | Cobertura |
| Fila 2 | `Robo e incendio total` | Cobertura |
| Fila 3 | `Daños por choque al vehículo` | Cobertura |
| Celda sin cobertura | `No incluido` | Texto |
| Nota | `La prima final depende del vehículo y se informa al cotizar.` | Texto legal/aclaratorio |
| Sección pagos, título | `Cómo pagar` | Título de sección |
| Tarjeta A, título | `Pago online` | Título |
| Tarjeta A, acción | `Consultar póliza` | Link |
| Tarjeta A, texto | `Elegí Pasarela A o Pasarela B y pagá con tarjeta o dinero en cuenta.` | Texto |
| Tarjeta B, título | `Efectivo con Pago Fácil` | Título |
| Tarjeta B, acción | `Ver ejemplo de cupón` | Link |
| Tarjeta B, texto | `Pagá en efectivo con el cupón de Pago Fácil, que tiene un código de barras de 42 dígitos.` | Texto |
| Footer, etiquetas | `Teléfono`, `Email`, `Ubicación`, `Horarios` | Etiquetas |
| Footer, valores | `A confirmar`, `A confirmar`, `Dirección a confirmar`, `Lunes a viernes, horario a confirmar` | Valores de contacto (pendientes) |
| Footer, copyright | `© 2026 Nexa Seguros. Todos los derechos reservados.` | Legal |

Los textos "Pasarela A" y "Pasarela B" son los del Figma. El back usa `pasarela1` y `pasarela2` como códigos de proveedor (`PagoPublicoRequest.Proveedor`). Los nombres visibles quedan como el Figma los define. Ver sección 13.

## 6. Campos y validaciones

No hay campos de entrada en W1. "Sin campos."

## 7. Estados

La pantalla es estática para el usuario, excepto la carga de los planes.

| Estado | Qué se muestra | Fuente |
|---|---|---|
| Cargando planes (tabla) | NO DEFINIDO en el Figma. Propuesta: skeleton de la tabla con la misma altura (160 px de encabezado y 3 filas). | |
| Éxito (planes cargados) | Tabla con los precios de `GET /api/planes`. | Figma: valores de referencia. |
| Error al cargar planes | NO DEFINIDO en el Figma. Propuesta: ocultar la tabla y mostrar un texto de error. Texto NO DEFINIDO. | |
| Vacío (sin planes activos) | NO DEFINIDO. | |
| Hover / foco de los botones y links | NO DEFINIDO en el Figma (no hay frames de estado). Ver sección 12. | |

Estados del Figma: sólo el estado "Default" está dibujado. No hay frames de carga, error ni vacío para W1.

## 8. Acciones y navegación

| Elemento | Acción | Destino |
|---|---|---|
| Logo "Nexa Seguros" | Ir al inicio | NO DEFINIDO (propuesta: `/`) |
| Nav "Planes" | Ir a la sección de planes | NO DEFINIDO (propuesta: ancla `#planes` en la misma página) |
| Nav "Contacto" | Ir a contacto | NO DEFINIDO (propuesta: ancla al footer `#contacto`) |
| Nav / hero "Consultar póliza" | Navegar | `/consultar-poliza` (W2) |
| Hero "Ver planes" | Ir a la sección de planes | NO DEFINIDO (propuesta: ancla `#planes`) |
| Tarjeta "Pago online" → "Consultar póliza" | Navegar | `/consultar-poliza` (W2) |
| Tarjeta "Efectivo con Pago Fácil" → "Ver ejemplo de cupón" | Navegar a la pantalla de ejemplo | W5 (`Cupón Pago Fácil`) (`W4-elegir-medio-pago.md` propone `/poliza/pagar/pago-facil`; el Figma de W1 no define ruta). Ver sección 13. |
| Chip "Valores de referencia" | No es interactivo en el Figma | Sin acción. Figma: Chip Neutro es informativo. |
| Celdas de la tabla | No son interactivas | Sin acción. |
| Footer | Sin acciones | Sin acción. |

No hay botón de login ni de registro en W1 (RN17: los clientes no tienen usuario).

## 9. Datos: endpoints y campos

| Dato en pantalla | Endpoint | Estado | Campo del DTO |
|---|---|---|---|
| Lista de planes (código, nombre, precio) | `GET /api/planes` (`PlanesController`, `[AllowAnonymous]`) | Implementado (existe en `development`) | `PlanResponse`: `Codigo`, `Nombre`, `Descripcion`, `PrimaBase`, `TiposPermitidos`, `AntiguedadMaxima`, `Activo` (`Aseguradora.Application/Dtos/PlanResponse.cs`). Respuesta: lista plana `IReadOnlyList<PlanResponse>` de los planes activos (`PlanesController.Listar` → `ListarActivosAsync`), sin paginación ni envoltorio. JSON en camelCase por defecto de ASP.NET (no hay `PropertyNamingPolicy` ni `ApiBehaviorOptions` en `Program.cs`). |
| Precio "desde" de cada plan | Mismo `GET /api/planes` | Implementado | Figma: "$ 10.000,00" (RC), "$ 18.000,00" (TC), "$ 27.500,00" (TR). Ver sección 13: el valor "desde" no es un campo del DTO. |
| Nombres "Responsabilidad Civil", "Terceros Completo", "Todo Riesgo" | `GET /api/planes` | Implementado | Figma los muestra como texto fijo. Verificar que el `Nombre` de los planes en el seed coincida. |
| Filas de cobertura (Responsabilidad civil a terceros, Robo e incendio total, Daños por choque) y las marcas ✓ / "No incluido" por plan | NO DEFINIDO. El `PlanResponse` no tiene matriz de coberturas. El texto del Figma no tiene endpoint. | NO DEFINIDO | |
| Textos de "Cómo pagar" | Ninguno (texto fijo del front) | Especificado como texto fijo | |
| Datos de contacto del footer | Ninguno. `AnalisisBack.md` §7: "los datos de contacto son texto fijo del front". | Texto fijo | |

Formato de importes: `$ 10.000,00` (separador de miles con punto, decimales con coma, prefijo "$ " con espacio). Un solo formateador en `@nexa/ui` o `@nexa/api` (FB4). RN16: los importes son `decimal(18,2)` en pesos.

Llamada: sólo `GET /api/planes` en la carga de la pantalla. Usar TanStack Query; no `fetch` suelto.

## 10. Reglas de negocio visibles

- **RN06** (cotización): el precio "desde" del Figma no sale de la fórmula completa. `AnalisisBack.md` RN06 multiplica la prima base por factores (moto 0,70; menos de 6 años 1,00; conductor menor de 25 1,30; uso particular 1,00). La prima final depende del vehículo: lo dice la nota "La prima final depende del vehículo y se informa al cotizar." Ver sección 13.
- **RN05** (planes): cada plan define qué vehículos acepta y la antigüedad máxima. El Figma no lo muestra; no agregarlo sin decisión del equipo.
- **RN10** (cobertura): sólo una póliza Vigente da cobertura. No aplica en W1, pero la tarjeta "Consultar póliza" lleva a W2 donde sí aplica.
- **RN17** (roles): los clientes no tienen usuario. W1 no tiene login.
- **RN18** (Pago Fácil): el cupón tiene 42 dígitos. Texto de la tarjeta B coincide con RN18.
- **RN20**: la consulta exige DNI y número de póliza. W1 sólo linkea a W2.

## 11. Responsive (mobile 390 px)

No hay frame mobile de W1 en el Figma (sólo están W2m y W3m). Ver sección 13.

Propuesta del analista (NO está en el Figma; el equipo la aprueba antes de implementar):
- Breakpoint: desktop a partir de 1440 px de referencia; en 390 px apilar todo en una columna.
- Nav: `Logo/Nexa` a la izquierda y un ícono `icon/list` (o `icon/menu`) a la derecha; ver W2m para la barra mobile. Qué abre el menú: NO DEFINIDO.
- Hero: título 28/34 (no 40/44), luego bajada, luego CTAs apilados a ancho completo (`Button` 40 px), luego la imagen placeholder a ancho completo con 16:12 o alto fijo. Proponer altura 220 px. NO DEFINIDO en el Figma.
- Tabla de planes: a 390 px no entran 4 columnas de 200 px. Propuesta: tarjetas por plan en lugar de tabla, o tabla con scroll horizontal dentro de su contenedor (sin scroll de página). NO DEFINIDO. Decisión del equipo.
- Tarjetas "Cómo pagar": una debajo de la otra, ancho completo.
- Footer: mismo patrón que `W2m` (lista vertical de etiquetas y valores).

## 12. Accesibilidad

- Un `h1` para el título del hero. `h2` para "Planes" y "Cómo pagar". La tabla de planes con `<table>`, encabezados con `scope="col"` y `scope="row"` en la columna de coberturas.
- Iconos de check (`icon/check`) tienen `alt=""` en el Figma. Como sólo indican presencia, el equipo necesita un texto accesible ("Incluido" o similar). Texto NO DEFINIDO. Sin esto, un lector de pantalla no distingue incluido de no incluido en las celdas con ícono.
- Celdas "No incluido" con texto: ya son accesibles.
- Destacado TC: el color lime (#F3F7C9) no puede ser el único indicador. El encabezado "TC" y el texto de cada celda ya lo distinguen, pero no hay indicación explícita de "más elegido" o similar. No agregar texto nuevo sin decisión.
- Links "Consultar póliza", "Ver ejemplo de cupón" con texto propio (no "Ver más"): ok.
- Foco visible en botones, links y tarjetas: NO DEFINIDO en el Figma. Propuesta: anillo de foco usando un token de foco del design system (NO DEFINIDO).
- Contraste: no verificado. Revisar `--nexa-text-tertiary` (#8A8E93) sobre `--nexa-surface-subtle` (#F1F2EE) para textos de 11 px (captions "desde", "por mes"). Es probable que no llegue a 4,5:1. Verificar antes de dar por aceptado.
- Orden de lectura y tabulación: nav, hero (CTAs), planes, pagos, footer.
- Imagen placeholder "Foto: auto y moto": si queda como marcador, `aria-hidden`. Si es una imagen real, `alt` NO DEFINIDO.

## 13. Dudas e inconsistencias Figma ↔ back

Cada punto es una pregunta para el equipo o para el back. No resolver por suposición.

1. **Imagen del hero.** El Figma tiene un contenedor de 560×420 con el texto "Foto: auto y moto". No hay asset ni URL de imagen real. NO DEFINIDO: ¿qué imagen va? ¿Se sube como asset del front?
2. **Precio "desde" de cada plan.** El Figma muestra $10.000, $18.000 y $27.500. El DTO `PlanResponse` expone `PrimaBase`. El back en `AnalisisBack.md` RN06 aplica factores. ¿El "desde" es `PrimaBase` tal cual, o el mínimo calculado con RN06? Los valores RC 10.000 y TC 18.000 coinciden con el ejemplo de "primas base de prueba" del ejemplo de cotización de `AnalisisBack.md` §9 (el ejemplo sólo menciona RC y TC). El TR 27.500 no tiene fuente identificada en el repo. NO DEFINIDO.
3. **Matriz de coberturas.** Las filas (RC / Robo e incendio / Daños por choque) y las marcas por plan no tienen endpoint. ¿La matriz es contenido fijo del front, o el back debe exponerla? NO DEFINIDO.
4. **Nombres de planes.** El Figma dice "Responsabilidad Civil" para RC, pero el `Nombre` del plan en la base puede ser distinto. Confirmar con el seed.
5. **"Pasarela A" y "Pasarela B".** El Figma las nombra así en la tarjeta de pago online. El back usa `pasarela1` y `pasarela2` (`PagoPublicoRequest.Proveedor`). ¿Cuál es el nombre visible para el cliente? NO DEFINIDO. `contratos-api/pagos-facturas.md` (línea 207) confirma que el repo no define los nombres comerciales.
6. **Destino de "Ver ejemplo de cupón".** El Figma no define la ruta. `W4-elegir-medio-pago.md` propone W5 en `/poliza/pagar/pago-facil`. Pregunta: ¿el enlace muestra un ejemplo estático (sin llamada) o un cupón real? Si es real, necesita `POST /api/publico/cupon`, Especificado en `AnalisisBack.md` §7 y en la tarea US-F3-06 de `docs/tareas-divididas.md` (línea 1602; sin PR abierta). Ver W3 §9.3.
7. **Destinos de nav y ancla.** "Planes", "Contacto", "Ver planes", el logo y los links del footer no tienen destino definido. NO DEFINIDO.
8. **Frame mobile de W1.** No existe en el Figma. Ver sección 11. NO DEFINIDO.
9. **Alto del frame.** El Backdrop del código de referencia tiene 1834 px; la captura del frame mide 1701 px. Confirmar el alto real del frame en Figma. No afecta a la implementación (el fondo es absoluto y se puede ajustar al alto de página).
10. **Datos de contacto del footer.** Dice "A confirmar" en todos los campos y "Lunes a viernes, horario a confirmar". Son textos provisionales que el Figma y `AnalisisBack.md` §7 dejan como texto fijo del front. ¿Cuál es el dato final? NO DEFINIDO.
11. **Copy de la marca.** "Nexa Seguros" aparece como marca. Confirmar que es el nombre de la empresa en la versión final.
12. **Enlaces de "Cómo pagar" con cuenta.** "Pagá con tarjeta o dinero en cuenta" menciona "dinero en cuenta", que no aparece en el back. Es el medio que ofrece la pasarela. Confirmar con el equipo de pagos (CU15). NO DEFINIDO.

## 14. Referencia Figma

- Página: `01 Web publica`
- Nodo W1 Inicio: `18:201`. URL: https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-201
- Subnodos clave: Shell `18:203`; Hero `18:214`; Planes `18:216`; Tabla planes `18:519`; Cómo pagar `18:218`; Footer `14:189`; Nav `14:179`.
- Fuente: archivo `nkiHNA713jSg1zgdz9WIWn` (Nexa Seguros), sesión de Figma `42891a01-3465-4fc6-94e0-dd63a868e051`.
