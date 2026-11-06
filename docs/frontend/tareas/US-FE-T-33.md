# US-FE-T-33: Avisos efímeros (Toaster con Sonner)

Tipo T · Oleada 4 · Tamaño S · Rama sugerida `feature/US-FE-B-24-usuarios-alta` (se entrega junto con US-FE-B-24 por decisión del usuario, 2026-11-06) · Tarjeta Trello `US-FE-T-33`

## 1. Objetivo

Al terminar, `@nexa/ui` exporta `Toaster` y `toast`, y el backoffice monta un único `Toaster` en la raíz. Las pantallas avisan con `toast.success(...)` y `toast.error(...)` en vez de avisos inline (convención FC19 del INDEX). Los toasts usan los tokens del design system, anuncian el aviso a lectores de pantalla y desaparecen solos. Decisión del usuario del 2026-11-06: se eligió Sonner entre Sonner, react-hot-toast y react-toastify.

## 2. Alcance

**Entra**
- Dependencia `sonner` (2.0.7) en `packages/ui/package.json` y el lockfile. Es una excepción acordada de FC17 (el usuario la pidió).
- `packages/ui/src/components/Toaster/Toaster.tsx`: `Toaster` (Sonner con `unstyled` y clases con tokens) y reexport de `toast`.
- Export en `packages/ui/src/index.ts`.
- Montaje de `<Toaster />` en `apps/backoffice/src/app/providers.tsx`.
- Uso en US-FE-B-24 (alta de empleado: éxito, errores de negocio, copia de contraseña).
- Convención FC19 en `docs/frontend/tareas/INDEX.md` y ítem en `docs/workflow.md`.

**NO entra**
- `Toaster` en `apps/web-publica`: se monta cuando la primera pantalla pública lo necesite (mismo componente, una línea en su raíz).
- Errores de validación de campo: siguen bajo el campo (FC10, FC16).
- Estados persistentes (sin permiso, vacío, error de carga de pantalla): siguen inline.
- Cola de avisos persistentes, historial o centro de notificaciones.
- Revisión de las demás pantallas ya mergeadas para migrarlas a toast: cada tarea las toma al tocarlas.

## 3. Dependencias

- **Oleada (INDEX):** 4 (se entrega con B-24).
- **Depende de:** `US-FE-T-04`, `US-FE-T-05` (tokens y primitivos), `US-FE-T-19` (harness a11y).
- **Pedidos al back:** ninguno.

## 4. Documentos a leer

- `docs/frontend/tareas/INDEX.md`: FC10, FC16, FC17 y FC19.
- `docs/frontend/design-system.md`: §1 (tokens), §8.2 (estados de error), §8.3 (foco).
- Documentación de Sonner: <https://sonner.emilkowal.ski/> (props `toastOptions`, `containerAriaLabel`, `icons`).

## 5. Archivos a crear o modificar

| Archivo | Acción | Nota |
|---|---|---|
| `packages/ui/package.json` y `package-lock.json` | modificar | `sonner` `^2.0.7` (excepción de FC17). |
| `packages/ui/src/components/Toaster/Toaster.tsx` | crear | `Toaster` y `toast`. |
| `packages/ui/src/components/Toaster/Toaster.test.tsx` | crear | Tests de §10. |
| `packages/ui/src/index.ts` | modificar | `export { Toaster, toast }`. |
| `apps/backoffice/src/app/providers.tsx` | modificar | `<Toaster />` después de `RouterProvider`. |

## 6. Pasos de implementación

1. `npm install sonner@2.0.7 --workspace=@nexa/ui` (versión con más de dos semanas de publicada).
2. Crear `Toaster` con: `position="bottom-right"`, `duration={5000}`, `visibleToasts={3}`, `theme="light"`, `containerAriaLabel="Notificaciones"`, íconos de Phosphor (`CheckCircle`, `WarningCircle`) y `toastOptions.unstyled` con clases de tokens: éxito `status-vigente-*`, error `status-cancelada-*`.
3. Exportarlo desde el barrel de `@nexa/ui`.
4. Montarlo una vez en `ProveedoresApp`.
5. Usarlo en B-24 (ver su ficha, §6 paso 9).

## 7. Contrato con el back

No aplica.

## 8. Contenido de UI

El componente no tiene textos propios: cada pantalla define el mensaje (FB7.6). Texto fijo: nombre de la región `Notificaciones` (`containerAriaLabel`).

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Éxito | Aviso verde con ícono, 5 s, `aria-live` educado de Sonner. |
| Error de negocio sin campo | Aviso rojo con ícono. El error sigue en español (nunca el texto en inglés del back). |
| Varios avisos | Hasta 3 visibles, apilados. |
| Mouse sobre el aviso | Pausa el cierre (comportamiento de Sonner). |
| Teclado | `alt + T` enfoca la región de avisos (Sonner). |
| Pantalla ancha de 320 px | `max-w-[calc(100vw-32px)]`: no desborda. |
| Error que la persona debe corregir | NO va en toast: va bajo el campo (FC19). |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, `vitest-axe`.

`components/Toaster/Toaster.test.tsx`:
1. `muestra_un_aviso_de_exito`.
2. `muestra_un_aviso_de_error`.
3. `la_region_tiene_nombre_en_espanol`.
4. `a11y_sin_violaciones` (con un aviso visible).

## 11. Criterios de aceptación

1. `@nexa/ui` exporta `Toaster` y `toast`, y el backoffice monta un único `Toaster` (tests 1 y 2; `providers.tsx`).
2. Los estilos salen de los tokens, sin valores de diseño sueltos.
3. La región se llama `Notificaciones` y no hay violaciones de `vitest-axe` (tests 3 y 4).
4. `sonner` queda declarado solo en `packages/ui/package.json` y en el lockfile.
5. FC19 está en el INDEX y el ítem en `docs/workflow.md`.
6. `npm run lint`, `typecheck`, `test` y `build` en verde y React Doctor 100/100.

## 12. Verificación manual

1. Con `VITE_USE_MOCKS=true`, en `/usuarios` crear un empleado: aparece el aviso verde `Usuario creado.` abajo a la derecha y desaparece solo.
2. Repetir el email: aparece el aviso rojo `El email ya está registrado.` y el campo no se marca.
3. Pulsar `Copiar`: aparece `Contraseña copiada.`.
4. Con teclado, `alt + T` lleva el foco a los avisos.

## 13. Decisiones pendientes con default

- **D-T33-01: biblioteca. Decidido por el usuario (2026-11-06):** Sonner.
- **D-T33-02: posición, duración y cantidad.** Default: abajo a la derecha, 5 s, 3 visibles. Se ajusta en V-05 si el Figma define otra cosa.
- **D-T33-03: botón de cerrar.** Default: sin botón (su texto accesible de Sonner viene en inglés). Los avisos de error que requieran acción se muestran inline.
- **D-T33-04: `Toaster` en la web pública.** Default: se monta cuando una pantalla lo necesite.

## 14. Riesgos y errores comunes

- **Toast para errores de campo.** No: se pierden a los 5 s y los lectores de pantalla no los asocian al campo (FC19).
- **Información crítica solo en toast.** Lo que la persona debe poder releer va también en pantalla.
- **Texto en inglés de Sonner.** Solo el botón de cerrar (que no se usa) y el atajo; la región se nombra en español.
- **Duplicar el aviso.** Si hay toast, no repetir el mismo texto inline.
- **Tests.** Montar `<Toaster />` en el render de la prueba; si no, `toast(...)` no muestra nada.

## 15. Definición de terminado

- Verificaciones de §11 con evidencia observada.
- Sin valores de diseño sueltos ni dependencias distintas de `sonner`.

## 16. Observaciones al índice

- Tarea nueva (2026-11-06), pedida por el usuario durante B-24. Se entrega en el mismo PR que B-24.
- Excepción de FC17 aprobada por el usuario: `sonner` en `packages/ui/package.json`.
- Las pantallas posteriores usan toast para avisos (FC19). Las ya mergeadas se migran cuando se toquen.
