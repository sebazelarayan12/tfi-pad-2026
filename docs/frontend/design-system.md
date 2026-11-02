# Design system Nexa

Documento de implementación del design system para el equipo de frontend (React + TypeScript + Tailwind 3.4). Se implementa en `frontend/packages/ui` (alias `@nexa/ui`); el preset de Tailwind va en `frontend/packages/config` (alias `@nexa/config`), según `00-decisiones-base.md`.

**Fuente**: Figma `Nexa-Seguros`, fileKey `nkiHNA713jSg1zgdz9WIWn`.
- Página `00 Fundamentos` (id `0:1`), frame F0 (id `11:2`, 1440 × 5803).
- Páginas `01 Web publica` (id `9:2`) y `02 Backoffice` (id `9:3`), usadas solo para confirmar anatomía de layout y frames móviles.

**Regla de lectura**: todo valor de este documento sale de Figma (variables, metadata o código de referencia de `get_design_context`). Lo que no está en el diseño aparece marcado como **propuesta**. Lo que no se pudo confirmar aparece en la sección 9, "Dudas".

**Idioma**: la prosa va en español neutro. Los textos de UI (por ejemplo "Ingresá tu DNI") se conservan tal como están en Figma, incluido el voseo.

---

## 0. Verificación de los valores de partida

| Valor esperado | Estado en Figma |
|---|---|
| `bg/backdrop-start` #EEF2B8 | Confirmado (variable `--nexa-bg-backdrop-start`) |
| `bg/backdrop-end` #D5DDE3 | Confirmado |
| `surface/panel` #FFFFFF | Confirmado |
| `text/primary` #17191C | Confirmado |
| `action/primary` #17191C | Confirmado |
| `accent/lime` #DCEB6B | Confirmado |
| `status/vigente/text` #1F7A4D | Confirmado |
| Estilo "Nexa/H1 28/34" | Confirmado (SemiBold 600, letter-spacing 0) |
| Spacing 4–64 | Confirmado. Hay 10 tokens: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Los tokens 20 y 40 existen como variable pero no tienen muestra visual en F0. |
| Radius card 16 / input 12 / pill 999 | Confirmado. Hay un cuarto radio: `--nexa-radius-shell` = 24 (lo usa el Shell). |

---

## 1. Tokens de color

Todos los tokens son variables de Figma. Las variables CSS usan el nombre exacto que devuelve `get_variable_defs`. Las clases Tailwind salen del preset de la sección 4.

| Token Figma (swatch) | Hex | Variable CSS | Clase Tailwind (`bg-`, `text-`, `border-`) | Uso |
|---|---|---|---|---|
| `bg/backdrop-start` | `#EEF2B8` | `--nexa-bg-backdrop-start` | `bg-backdrop-start` | Inicio del degradado del Backdrop (el degradado completo es `bg-backdrop`, sección 3.5) |
| `bg/backdrop-end` | `#D5DDE3` | `--nexa-bg-backdrop-end` | `bg-backdrop-end` | Fin del degradado del Backdrop |
| `surface/panel` | `#FFFFFF` | `--nexa-surface-panel` | `bg-surface-panel` | Shell, cards, inputs, botones secundarios, buscador del topbar |
| `surface/sidebar` | `#F5F5F2` | `--nexa-surface-sidebar` | `bg-surface-sidebar` | Sidebar y footer público |
| `surface/subtle` | `#F1F2EE` | `--nexa-surface-subtle` | `bg-surface-subtle` | Header de tabla, chip Neutro, campo deshabilitado |
| `border/hairline` | `#E7E8E3` | `--nexa-border-hairline` | `border-border-hairline` | Bordes de cards, divisores, campo deshabilitado |
| `border/strong` | `#D3D5CE` | `--nexa-border-strong` | `border-border-strong` | Borde de inputs, botón secundario, chip "Sin seleccionar", bell |
| `text/primary` | `#17191C` | `--nexa-text-primary` | `text-text-primary` | Texto principal, títulos, valor de campo con foco |
| `text/secondary` | `#5C6066` | `--nexa-text-secondary` | `text-text-secondary` | Labels de campo, navegación inactiva, encabezados de tabla |
| `text/tertiary` | `#8A8E93` | `--nexa-text-tertiary` | `text-text-tertiary` | Placeholder, helper, captions, texto deshabilitado. Ver sección 8: no cumple AA sobre panel. |
| `action/primary` | `#17191C` | `--nexa-action-primary` | `bg-action-primary` | Botón primario, indicador de nav activo, foco del input |
| `action/on-primary` | `#FFFFFF` | `--nexa-action-on-primary` | `text-action-on-primary` | Texto sobre `action/primary` |
| `accent/lime` | `#DCEB6B` | `--nexa-accent-lime` | `bg-accent-lime` | Chip "Destacado" |
| `accent/lime-soft` | `#F3F7C9` | `--nexa-accent-lime-soft` | `bg-accent-lime-soft` | Fondo del avatar del usuario |
| `accent/promo` | `#F6E7A8` | `--nexa-accent-promo` | `bg-accent-promo` | Reservado para promociones. No aparece en componentes de F0. |
| `status/vigente/text` | `#1F7A4D` | `--nexa-status-vigente-text` | `text-status-vigente-text` | Badge Vigente, Pagada, Validado |
| `status/vigente/bg` | `#E3F4EA` | `--nexa-status-vigente-bg` | `bg-status-vigente-bg` | Badge Vigente, Pagada, Validado |
| `status/pendiente/text` | `#5A5F8C` | `--nexa-status-pendiente-text` | `text-status-pendiente-text` | Badge Pendiente |
| `status/pendiente/bg` | `#ECEDF7` | `--nexa-status-pendiente-bg` | `bg-status-pendiente-bg` | Badge Pendiente |
| `status/suspendida/text` | `#9A6400` | `--nexa-status-suspendida-text` | `text-status-suspendida-text` | Badge Suspendida, Pendiente CAE |
| `status/suspendida/bg` | `#FBF0D6` | `--nexa-status-suspendida-bg` | `bg-status-suspendida-bg` | Badge Suspendida, Pendiente CAE |
| `status/cancelada/text` | `#B03A2E` | `--nexa-status-cancelada-text` | `text-status-cancelada-text` | Badge Cancelada. También color de borde y helper de error de input/select. |
| `status/cancelada/bg` | `#FBE5E2` | `--nexa-status-cancelada-bg` | `bg-status-cancelada-bg` | Badge Cancelada |
| `status/vencida/text` | `#5C6066` | `--nexa-status-vencida-text` | `text-status-vencida-text` | Badge Vencida, Anulada |
| `status/vencida/bg` | `#EEEFEC` | `--nexa-status-vencida-bg` | `bg-status-vencida-bg` | Badge Vencida, Anulada |

### 1.1 Pares texto/fondo por estado

Ratios calculados con la fórmula WCAG 2.x sobre los hex de Figma. "AA texto normal" exige 4.5:1.

| Par | Texto | Fondo | Ratio | AA texto normal |
|---|---|---|---|---|
| Vigente | `#1F7A4D` | `#E3F4EA` | 4.66 | Cumple |
| Pendiente | `#5A5F8C` | `#ECEDF7` | 5.22 | Cumple |
| Suspendida | `#9A6400` | `#FBF0D6` | **4.42** | **No cumple** (faltan 0.08) |
| Cancelada | `#B03A2E` | `#FBE5E2` | 4.99 | Cumple |
| Vencida / Anulada | `#5C6066` | `#EEEFEC` | 5.48 | Cumple |
| Pagada / Validado | igual a Vigente | igual a Vigente | 4.66 | Cumple |
| Pendiente CAE | igual a Suspendida | igual a Suspendida | 4.42 | **No cumple** |

Ratios sobre `surface/panel` (#FFFFFF), para los textos de estado usados sin fondo:

| Texto | Ratio |
|---|---|
| `status/vigente/text` | 5.32 |
| `status/pendiente/text` | 6.09 |
| `status/suspendida/text` | 5.00 |
| `status/cancelada/text` (helper de error) | 6.02 |

### 1.2 CSS de variables (base del preset)

Ubicación propuesta: `frontend/packages/ui/src/styles/tokens.css`. Los valores son exactos de Figma.

```css
:root {
  --nexa-bg-backdrop-start: #eef2b8;
  --nexa-bg-backdrop-end: #d5dde3;

  --nexa-surface-panel: #ffffff;
  --nexa-surface-sidebar: #f5f5f2;
  --nexa-surface-subtle: #f1f2ee;

  --nexa-border-hairline: #e7e8e3;
  --nexa-border-strong: #d3d5ce;

  --nexa-text-primary: #17191c;
  --nexa-text-secondary: #5c6066;
  --nexa-text-tertiary: #8a8e93;

  --nexa-action-primary: #17191c;
  --nexa-action-on-primary: #ffffff;

  --nexa-accent-lime: #dceb6b;
  --nexa-accent-lime-soft: #f3f7c9;
  --nexa-accent-promo: #f6e7a8;

  --nexa-status-vigente-text: #1f7a4d;
  --nexa-status-vigente-bg: #e3f4ea;
  --nexa-status-pendiente-text: #5a5f8c;
  --nexa-status-pendiente-bg: #ecedf7;
  --nexa-status-suspendida-text: #9a6400;
  --nexa-status-suspendida-bg: #fbf0d6;
  --nexa-status-cancelada-text: #b03a2e;
  --nexa-status-cancelada-bg: #fbe5e2;
  --nexa-status-vencida-text: #5c6066;
  --nexa-status-vencida-bg: #eeefec;

  --nexa-radius-card: 16px;
  --nexa-radius-input: 12px;
  --nexa-radius-shell: 24px;
  --nexa-radius-pill: 999px;

  --nexa-spacing-4: 4px;
  --nexa-spacing-8: 8px;
  --nexa-spacing-12: 12px;
  --nexa-spacing-16: 16px;
  --nexa-spacing-20: 20px;
  --nexa-spacing-24: 24px;
  --nexa-spacing-32: 32px;
  --nexa-spacing-40: 40px;
  --nexa-spacing-48: 48px;
  --nexa-spacing-64: 64px;
}
```

Figma no define un modo oscuro. No se propone uno en este documento.

---

## 2. Tipografía

### 2.1 Familias

| Familia | Uso | Pesos usados en Figma | Licencia y carga |
|---|---|---|---|
| **Plus Jakarta Sans** | Toda la UI de texto | 400 Regular, 500 Medium, 600 SemiBold, 700 Bold | Google Fonts, licencia SIL OFL (gratuita). |
| **JetBrains Mono** | Identificadores (DNI, póliza, patente) e importes | 400 Regular, 500 Medium | Google Fonts, licencia SIL OFL (gratuita). |

Confirmado por `get_variable_defs` (`Nexa/H1: Font(family: "Plus Jakarta Sans", ...)`, `Nexa/Mono: Font(family: "JetBrains Mono", ...)`).

Carga (Google Fonts, en `index.html` de cada app o en `tokens.css` con `@import`):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

Todos los estilos usan `letter-spacing: 0`.

### 2.2 Los 10 estilos

| Estilo (Figma) | Nombre en Tailwind | Familia | Tamaño | Line-height | Peso | Tracking |
|---|---|---|---|---|---|---|
| Nexa/Display 40/44 | `text-display` | Plus Jakarta Sans | 40px | 44px | 700 Bold | 0 |
| Nexa/H1 28/34 | `text-h1` | Plus Jakarta Sans | 28px | 34px | 600 SemiBold | 0 |
| Nexa/H2 20/26 | `text-h2` | Plus Jakarta Sans | 20px | 26px | 600 SemiBold | 0 |
| Nexa/H3 16/22 | `text-h3` | Plus Jakarta Sans | 16px | 22px | 600 SemiBold | 0 |
| Nexa/Body 14/20 | `text-body` | Plus Jakarta Sans | 14px | 20px | 400 Regular | 0 |
| Nexa/Body-sm 13/18 | `text-body-sm` | Plus Jakarta Sans | 13px | 18px | 400 Regular | 0 |
| Nexa/Label 12/16 | `text-label` | Plus Jakarta Sans | 12px | 16px | 500 Medium | 0 |
| Nexa/Caption 11/14 | `text-caption` | Plus Jakarta Sans | 11px | 14px | 500 Medium | 0 |
| Nexa/Mono 13/18 | `text-mono` | JetBrains Mono | 13px | 18px | 400 Regular | 0 |
| Nexa/Mono-lg 22/28 | `text-mono-lg` | JetBrains Mono | 22px | 28px | 500 Medium | 0 |

Notas:
- El texto de la muestra de cada estilo en Figma se rotula con su propio nombre (por ejemplo "Nexa/H1 28/34"). Esa rotulación es solo documentación y no debe implementarse.
- El estilo "Nexa/Caption" es el de los metadatos de tabla y footer. "Nexa/Label" es el de labels de campo, chips, badges y encabezados de tabla.

---

## 3. Espaciado, radios, sombras, bordes y fondos

### 3.1 Espaciado (10 tokens)

| Token | Valor | Uso observado en componentes |
|---|---|---|
| `spacing/4` | 4px | Gap entre ítems de nav, padding vertical de chip, gap título-acción de card |
| `spacing/8` | 8px | Gap de label→campo→helper, gap ícono→texto en botón, gap interno del NavItem |
| `spacing/12` | 12px | Padding horizontal de campos, chips, badges, botones S y Ghost S. Gap de avatar y nombre. |
| `spacing/16` | 16px | Padding horizontal de botones M, gap del Sidebar y del Topbar, padding del Sidebar, padding de la fila de tabla |
| `spacing/20` | 20px | Padding de Card/Widget (variable; sin muestra en F0) |
| `spacing/24` | 24px | Gap entre secciones de F0, gap de la fila de tipografía |
| `spacing/32` | 32px | Gap del PublicNav, padding vertical de PublicFooter |
| `spacing/40` | 40px | Padding horizontal de PublicFooter; padding de contenido web en W3 (observado en el frame, no en una variable de componente) |
| `spacing/48` | 48px | Gap entre columnas de contacto del footer |
| `spacing/64` | 64px | Máximo de la escala (muestra de F0) |

### 3.2 Radios

| Token | Valor | Uso |
|---|---|---|
| `radius/card` | 16px | Card/Widget, PublicFooter |
| `radius/input` | 12px | Inputs, selects, buscadores, logo mark (28×28) |
| `radius/shell` | 24px | Shell (solo) |
| `radius/pill` | 999px | Botones, chips, badges, bell, avatar |

Header de Table/Header: radio superior 12px (`radius/input`), inferior 0.

### 3.3 Bordes

| Borde | Grosor | Color | Uso |
|---|---|---|---|
| Hairline | 1px | `border/hairline` | Card/Widget, divisores (Sidebar, Table/Row), campo deshabilitado |
| Strong | 1px | `border/strong` | Input y select por defecto, botón Secondary, chip "Sin seleccionar", buscador y bell del Topbar |
| Foco (input/select) | 2px | `action/primary` | Estado Focus de Input y Select |
| Error (input/select) | 1px | `status/cancelada/text` | Estado Error de Input y Select |

### 3.4 Sombras

Única sombra del sistema: `Nexa/Shadow/Shell`, solo en el Shell.

```
box-shadow: 0px 24px 60px 0px rgba(60, 70, 40, 0.10);
```

Figma la define como `#3C4628` con alfa `1A` (26/255 ≈ 0.10). Ningún otro componente tiene sombra. Las cards se diferencian por borde hairline, no por sombra.

### 3.5 Fondos

**Backdrop**: degradado lineal de dos stops.

| Propiedad | Valor de Figma |
|---|---|
| Stop 0% | `#EEF2B8` (`rgb(238, 242, 184)`) |
| Stop 100% | `#D5DDE3` (`rgb(213, 221, 227)`) |
| Ángulo (frame 1440×1024) | 144.58° = `180° − atan(1024/1440)` |

El ángulo 144.58° es exactamente la dirección "to bottom right" de un frame de 1440×1024. En otras proporciones, un ángulo fijo no llega a las esquinas. Por eso el preset usa `to bottom right`, que se comporta como Figma en el desktop y sigue de esquina a esquina en el frame móvil de 390×1076.

Tamaños del Backdrop observados: 1440×1024 (F0, desktop), 1440×1374 (W3, con contenido), 390×1076 (W2m, móvil).

---

## 4. Preset de Tailwind (`@nexa/config`)

Ubicación propuesta: `frontend/packages/config/tailwind/nexa.preset.js`. Cada app lo usa con `presets: [require('@nexa/config/tailwind/nexa.preset')]`.

Decisiones explícitas:
- **Espaciado**: se extiende el scale (no se reemplaza) con claves `sp-N`. Así `p-4` sigue siendo 16px de Tailwind y no se rompe nada. Los tokens de Figma quedan como `p-sp-16`, `gap-sp-8`, etc. Con eso no hay colisión con la escala por defecto.
- **Colores**: se usan `var(--nexa-*)`, no hex. El cambio de tema pasa por las variables CSS.
- **Degradado**: `bg-backdrop` usa `to bottom right`, no un ángulo fijo.

```js
// frontend/packages/config/tailwind/nexa.preset.js
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        backdrop: {
          start: 'var(--nexa-bg-backdrop-start)',
          end: 'var(--nexa-bg-backdrop-end)',
        },
        surface: {
          panel: 'var(--nexa-surface-panel)',
          sidebar: 'var(--nexa-surface-sidebar)',
          subtle: 'var(--nexa-surface-subtle)',
        },
        border: {
          hairline: 'var(--nexa-border-hairline)',
          strong: 'var(--nexa-border-strong)',
        },
        text: {
          primary: 'var(--nexa-text-primary)',
          secondary: 'var(--nexa-text-secondary)',
          tertiary: 'var(--nexa-text-tertiary)',
        },
        action: {
          primary: 'var(--nexa-action-primary)',
          'on-primary': 'var(--nexa-action-on-primary)',
        },
        accent: {
          lime: 'var(--nexa-accent-lime)',
          'lime-soft': 'var(--nexa-accent-lime-soft)',
          promo: 'var(--nexa-accent-promo)',
        },
        status: {
          vigente: {
            text: 'var(--nexa-status-vigente-text)',
            bg: 'var(--nexa-status-vigente-bg)',
          },
          pendiente: {
            text: 'var(--nexa-status-pendiente-text)',
            bg: 'var(--nexa-status-pendiente-bg)',
          },
          suspendida: {
            text: 'var(--nexa-status-suspendida-text)',
            bg: 'var(--nexa-status-suspendida-bg)',
          },
          cancelada: {
            text: 'var(--nexa-status-cancelada-text)',
            bg: 'var(--nexa-status-cancelada-bg)',
          },
          vencida: {
            text: 'var(--nexa-status-vencida-text)',
            bg: 'var(--nexa-status-vencida-bg)',
          },
        },
      },

      fontFamily: {
        sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
        mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
      },

      fontSize: {
        display: ['40px', { lineHeight: '44px', fontWeight: '700', letterSpacing: '0' }],
        h1: ['28px', { lineHeight: '34px', fontWeight: '600', letterSpacing: '0' }],
        h2: ['20px', { lineHeight: '26px', fontWeight: '600', letterSpacing: '0' }],
        h3: ['16px', { lineHeight: '22px', fontWeight: '600', letterSpacing: '0' }],
        body: ['14px', { lineHeight: '20px', fontWeight: '400', letterSpacing: '0' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400', letterSpacing: '0' }],
        label: ['12px', { lineHeight: '16px', fontWeight: '500', letterSpacing: '0' }],
        caption: ['11px', { lineHeight: '14px', fontWeight: '500', letterSpacing: '0' }],
        mono: ['13px', { lineHeight: '18px', fontWeight: '400', letterSpacing: '0' }],
        'mono-lg': ['22px', { lineHeight: '28px', fontWeight: '500', letterSpacing: '0' }],
      },

      spacing: {
        'sp-4': '4px',
        'sp-8': '8px',
        'sp-12': '12px',
        'sp-16': '16px',
        'sp-20': '20px',
        'sp-24': '24px',
        'sp-32': '32px',
        'sp-40': '40px',
        'sp-48': '48px',
        'sp-64': '64px',
      },

      borderRadius: {
        card: '16px',
        input: '12px',
        shell: '24px',
        pill: '999px',
      },

      boxShadow: {
        shell: '0px 24px 60px 0px rgba(60, 70, 40, 0.1)',
      },

      backgroundImage: {
        backdrop: 'linear-gradient(to bottom right, var(--nexa-bg-backdrop-start), var(--nexa-bg-backdrop-end))',
      },
    },
  },
};

```

Nota de uso: el preset no necesita `content`. Eso lo define cada app.

Ejemplos de clases resultantes: `bg-surface-panel`, `text-text-secondary`, `text-label`, `rounded-input`, `p-sp-12`, `gap-sp-8`, `shadow-shell`, `bg-backdrop`, `text-mono`.

---

## 5. Componentes

Convenciones comunes:
- Todos los botones, chips y badges tienen `border-radius: 999px` (`rounded-pill`).
- Alturas fijas. El ancho es "hug" (según contenido) salvo que se indique otra cosa.
- Los textos de UI llevan el texto de Figma. Los identificadores de Figma aparecen entre paréntesis para trazabilidad.

### 5.1 Button

**Nodo Figma**: set `11:42` ("Button"). Descripción en Figma: "Pill button. Primary for the main action of a screen, Secondary for alternatives, Ghost for inline actions. Size M is 40px high, S is 32px high."

| Variante | Tamaño | Alto | Padding horizontal | Gap ícono-texto | Fondo | Borde | Texto | Tipografía | Nodo (sin ícono / con ícono) |
|---|---|---|---|---|---|---|---|---|---|
| Primary | M | 40px | 16px | 8px | `action/primary` | ninguno | `action/on-primary` | Body 14/20 Regular | 11:6 / 11:8 |
| Primary | S | 32px | 12px | 8px | `action/primary` | ninguno | `action/on-primary` | Label 12/16 Medium | 11:12 / 11:14 |
| Secondary | M | 40px | 16px | 8px | `surface/panel` | 1px `border/strong` | `text/primary` | Body 14/20 Regular | 11:18 / 11:20 |
| Secondary | S | 32px | 12px | 8px | `surface/panel` | 1px `border/strong` | `text/primary` | Label 12/16 Medium | 11:24 / 11:26 |
| Ghost | M | 40px | 16px | 8px | transparente | ninguno | `text/primary` | Body 14/20 Regular | 11:30 / 11:32 |
| Ghost | S | 32px | 12px | 8px | transparente | ninguno | `text/primary` | Label 12/16 Medium | 11:36 / 11:38 |

Notas de anatomía:
- Con ícono: el ícono `plus` va a la izquierda del texto, 16×16. Figma usa un asset para Primary y otro para Secondary/Ghost (ver sección 9).
- La tipografía cambia por tamaño, no por variante: M = Body Regular, S = Label Medium.
- Ancho: hug. Solo el alto y el padding son fijos.

Props propuestas:

```ts
type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'm' | 's';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;        // default 'primary'
  size?: ButtonSize;              // default 'm'
  icon?: React.ReactNode;         // ícono Phosphor 16px a la izquierda; si se omite, no hay ícono
  label: string;                  // texto visible; obligatorio
}
```

### 5.2 Input

**Nodo Figma**: set `11:66` ("Input"). Descripción en Figma: "Input field with label above, field, and helper text below. States: Default, Focus, Error, Disabled. Never use the placeholder as the label."

Anatomía (de arriba a abajo, columna, gap 8px):
1. Label: Label 12/16 Medium, color `text/secondary`.
2. Campo: alto 40px, padding horizontal 12px, radio `radius/input` (12px), fondo `surface/panel` (excepto Disabled).
3. Helper: Label 12/16 Medium.

Ancho del componente en Figma: 320px (`w-[320px]`). Es el ancho de muestra. En la app debe ser `w-full` dentro de su contenedor.

| Estado | Nodo | Borde del campo | Fondo | Texto del valor | Label | Helper |
|---|---|---|---|---|---|---|
| Default | 11:46 | 1px `border/strong` | `surface/panel` | Body 14/20, color `text/tertiary` (placeholder) | `text/secondary` | `text/tertiary` |
| Focus | 11:51 | **2px** `action/primary` | `surface/panel` | Body 14/20, `text/primary` | `text/secondary` | `text/tertiary` |
| Error | 11:56 | 1px `status/cancelada/text` | `surface/panel` | Body 14/20, `text/primary` | `text/secondary` | `status/cancelada/text` |
| Disabled | 11:61 | 1px `border/hairline` | `surface/subtle` | Body 14/20, `text/tertiary` | `text/secondary` con opacidad 60% | `text/tertiary` |

Props propuestas:

```ts
type FieldState = 'default' | 'focus' | 'error' | 'disabled';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;                  // obligatorio. Nunca usar placeholder como label.
  helper?: string;                // texto de ayuda o de error
  state?: FieldState;             // Focus y Error se pueden derivar de foco y de la validación
  error?: boolean;                // atajo: state='error'
}
```

Nota de implementación: en Focus el borde pasa de 1px a 2px. Si el campo no tiene `box-sizing: border-box` o el alto cambia, hay un salto de 1px de layout. Ver sección 8.

### 5.3 Select

**Nodo Figma**: set `11:95` ("Select"). Mismo esquema que Input, con ícono `caret-down` a la derecha del campo (16×16, `justify-between`).

| Estado | Nodo | Borde | Fondo | Texto del valor | Caret | Label | Helper |
|---|---|---|---|---|---|---|---|
| Default | 11:67 | 1px `border/strong` | `surface/panel` | Placeholder "Seleccioná una opción" en `text/tertiary` | sí | `text/secondary` | `text/tertiary` |
| Focus | 11:74 | 2px `action/primary` | `surface/panel` | `text/primary` | sí | `text/secondary` | `text/tertiary` |
| Error | 11:81 | 1px `status/cancelada/text` | `surface/panel` | `text/primary` | sí | `text/secondary` | `status/cancelada/text` |
| Disabled | 11:88 | 1px `border/hairline` | `surface/subtle` | `text/tertiary` | sí | `text/secondary` 60% | `text/tertiary` |

Props propuestas:

```ts
interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string = string> {
  label: string;
  options: ReadonlyArray<SelectOption<T>>;
  value?: T;
  placeholder?: string;           // default 'Seleccioná una opción'
  helper?: string;
  state?: FieldState;             // 'default' | 'focus' | 'error' | 'disabled'
  onChange?: (value: T) => void;
}
```

### 5.4 Badge/Estado

**Nodo Figma**: set `11:117` ("Badge/Estado"). Descripción en Figma: "Status badge for policy and cuota states. Colors map to semantic status tokens only. Pagada and Validado use Vigente colors, Pendiente CAE uses Suspendida colors, Anulada uses Vencida colors."

Anatomía: solo texto. Sin ícono ni punto.
- Alto 24px, padding horizontal 12px, vertical 4px, radio pill, hug de ancho.
- Texto: Label 12/16 Medium.

| Estado | Nodo | Fondo | Texto | Ancho medido (Figma) |
|---|---|---|---|---|
| Pendiente | 11:99 | `status/pendiente/bg` | `status/pendiente/text` | 83px |
| Vigente | 11:101 | `status/vigente/bg` | `status/vigente/text` | 70px |
| Suspendida | 11:103 | `status/suspendida/bg` | `status/suspendida/text` | 94px |
| Cancelada | 11:105 | `status/cancelada/bg` | `status/cancelada/text` | 87px |
| Vencida | 11:107 | `status/vencida/bg` | `status/vencida/text` | 71px |
| Pagada | 11:109 | igual a Vigente | igual a Vigente | 68px |
| Anulada | 11:111 | igual a Vencida | igual a Vencida | 71px |
| Validado | 11:113 | igual a Vigente | igual a Vigente | 75px |
| Pendiente CAE | 11:115 | igual a Suspendida | igual a Suspendida | 110px |

Props propuestas:

```ts
type EstadoBadgeValue =
  | 'Pendiente' | 'Vigente' | 'Suspendida' | 'Cancelada' | 'Vencida'
  | 'Pagada' | 'Anulada' | 'Validado' | 'Pendiente CAE';

interface EstadoBadgeProps {
  estado: EstadoBadgeValue;
}
```

Nota: los valores del prop deben coincidir con el enum que devuelve el back. Ver sección 9.

### 5.5 Chip

**Nodo Figma**: set `11:126` ("Chip"). Descripción en Figma: "Chip. Destacado (lime) marks the one thing that matters on a widget. Neutro is informational. Seleccionado and Sin seleccionar are selectable filter chips."

Anatomía: texto solo. Alto 28px, padding horizontal 12px, vertical 4px, radio pill, texto Label 12/16 Medium, hug de ancho (medidos: 73, 73, 73, 75px).

| Tipo | Nodo | Fondo | Borde | Texto | Uso |
|---|---|---|---|---|---|
| Destacado | 11:118 | `accent/lime` | ninguno | `text/primary` | Marca lo único importante de un widget |
| Neutro | 11:120 | `surface/subtle` | ninguno | `text/secondary` | Información |
| Seleccionado | 11:122 | `action/primary` | ninguno | `action/on-primary` | Filtro seleccionado |
| Sin seleccionar | 11:124 | `surface/panel` | 1px `border/strong` | `text/primary` | Filtro no seleccionado |

Props propuestas:

```ts
type ChipTipo = 'destacado' | 'neutro' | 'seleccionado' | 'sin-seleccionar';

interface ChipProps {
  tipo: ChipTipo;               // default 'destacado' en el diseño
  label: string;
  onClick?: () => void;         // Seleccionado y Sin seleccionar son interactivos. Destacado y Neutro no.
}
```

### 5.6 NavItem

**Nodo Figma**: set `14:99` ("NavItem"). Descripción en Figma: "Sidebar nav item: 2px indicator bar at the left edge and darker text when Active=true. Icon is a Phosphor Regular glyph."

Anatomía (fila horizontal, gap 8px, alto 32px, ancho 200px):
1. Indicador: barra de 2px × 20px en el borde izquierdo. En activo, color `action/primary`. En inactivo, sin color (transparente).
2. Ícono Phosphor Regular, 16×16.
3. Texto Body-sm 13/18 Regular.

Color del texto: `text/primary` si activo, `text/secondary` si inactivo.

Ítems (de la pantalla "Inicio" en el Sidebar del diseño):

| Ícono (layer) | Texto | Nodo inactivo | Nodo activo |
|---|---|---|---|
| house | Inicio | 14:9 | 14:14 |
| users | Clientes | 14:19 | 14:24 |
| car | Vehículos | 14:29 | 14:34 |
| calculator | Cotizaciones | 14:39 | 14:44 |
| file-text | Pólizas | 14:49 | 14:54 |
| receipt | Pagos y facturas | 14:59 | 14:64 |
| barcode | Pago Fácil | 14:69 | 14:74 |
| list | Planes | 14:79 | 14:84 |
| user-circle | Usuarios | 14:89 | 14:94 |

Props propuestas:

```ts
type NavIcon =
  | 'house' | 'users' | 'car' | 'calculator' | 'file-text'
  | 'receipt' | 'barcode' | 'list' | 'user-circle';

interface NavItemProps {
  label: string;
  icon: NavIcon;                // se mapea a un componente Phosphor en la sección 6
  active?: boolean;             // default false
  href: string;                 // es un link de React Router; no es un botón
}
```

### 5.7 Logo/Nexa

**Nodo Figma**: `14:5` ("Logo/Nexa"). Descripción en Figma: "Nexa monogram plus wordmark. The only hand-made brand mark."

Anatomía (fila, gap 8px):
1. Marca "N": cuadrado 28×28, radio `radius/input` (12px), fondo `action/primary`. La letra "N" es Plus Jakarta Sans Bold 16px, line-height `normal`, color `action/on-primary`.
2. Wordmark "Nexa Seguros": H3 16/22 SemiBold, color `text/primary`.

Props propuestas:

```ts
interface LogoNexaProps {
  showWordmark?: boolean;       // default true; false en vistas compactas
}
```

Nota: la "N" de 16px Bold con line-height `normal` no pertenece a los 10 estilos del sistema. Ver sección 9.

### 5.8 Sidebar

**Nodo Figma**: `14:100` ("Sidebar") en F0, y su instancia `18:239` en el Backoffice (B2).

| Propiedad | F0 (muestra) | Backoffice (B2) |
|---|---|---|
| Ancho | 232px | 232px |
| Alto | 960px | 976px (alto completo del Shell) |
| Posición | flotante en la muestra | pegado al borde izquierdo del Shell (x=0), sin inset |
| Fondo | `surface/sidebar` | `surface/sidebar` |
| Padding | 16px | 16px (confirmar, ver sección 9) |
| Gap entre secciones | 16px | 16px |

Anatomía, de arriba abajo:
1. `Logo/Nexa` (ver 5.7).
2. Buscador: alto 36px, padding horizontal 12px, gap 8px, radio input, fondo `surface/panel`, borde 1px **`border/hairline`**, ícono `magnifying-glass` 16px, placeholder "Buscar" Body-sm en `text/tertiary`.
3. Sección "Nav main" (gap 4px): Inicio, Clientes, Vehículos, Cotizaciones, Pólizas, Pagos y facturas, Pago Fácil (7 `NavItem`). El primero activo en la muestra.
4. Divisor: 1px, `border/hairline`, ancho completo.
5. Sección "Nav admin" (gap 4px): Planes, Usuarios.
6. Espaciador (`flex-1`).
7. Bloque de usuario (gap 12px): avatar 32×32 pill con fondo `accent/lime-soft`, iniciales "MQ" en Caption 11/14 Medium `text/primary`; bloque de texto (gap 2px) con nombre en Body-sm `text/primary` y rol en Caption `text/tertiary`; ícono `dots-three` 16px a la derecha.

Props propuestas:

```ts
interface SidebarProps {
  children?: React.ReactNode;   // NavItem y secciones
  user: { initials: string; name: string; role: string };
  onSearch?: (query: string) => void;
}
```

### 5.9 Topbar

**Nodo Figma**: `14:167` ("Topbar") en F0; instancia `18:309` en el Backoffice (B2, ancho 795px).

Dimensiones: 960 × 64px (F0). Gap 16px. Sin padding interno.

Anatomía, de izquierda a derecha:
1. Título: H2 20/26 SemiBold, `text/primary`. Muestra: "Clientes".
2. Espaciador (`flex-1`).
3. Buscador: 280 × 36px, padding horizontal 12px, gap 8px, radio input, fondo `surface/panel`, **borde 1px `border/strong`**, ícono `magnifying-glass` 16px, placeholder Body-sm `text/tertiary`: "Buscar por DNI o apellido".
4. Bell: círculo 36×36, radio pill, fondo `surface/panel`, borde 1px `border/strong`, ícono `bell` 16px centrado.
5. Botón primario M con etiqueta "Nuevo cliente" (`14:167` usa `Button` M Primary sin ícono).

Props propuestas:

```ts
interface TopbarProps {
  title: string;
  searchPlaceholder?: string;   // default 'Buscar'
  onSearch?: (query: string) => void;
  onNotificationsClick?: () => void;
  action?: React.ReactNode;     // normalmente un Button primario
}
```

### 5.10 PublicNav

**Nodo Figma**: `14:179` ("PublicNav"). Instancia en W3 (`18:50`, ancho 1392px).

Dimensiones: 1344 × 72px (F0). Padding horizontal 24px, gap 32px, alineado al centro vertical.

Anatomía:
1. `Logo/Nexa` (5.7).
2. Espaciador.
3. Links "Planes" y "Contacto": Body 14/20 Regular, `text/secondary`.
4. Botón primario M "Consultar póliza".

Props propuestas:

```ts
interface PublicNavProps {
  links: ReadonlyArray<{ label: string; href: string }>;
  ctaLabel: string;             // ej. 'Consultar póliza'
  ctaHref: string;
}
```

### 5.11 PublicFooter

**Nodo Figma**: `14:189` ("PublicFooter").

Dimensiones: 1344px de ancho (F0), alto por contenido. Padding 32px vertical y 40px horizontal. Gap entre bloques 24px. Fondo `surface/sidebar`. Radio card (16px). Sin borde ni sombra.

Anatomía:
1. Fila de contacto (gap 48px). Cuatro columnas, cada una con gap 4px:
   - Label Caption 11/14 Medium, `text/tertiary`.
   - Valor Body-sm 13/18 Regular, `text/primary`.
   - Columnas: "Teléfono" → "A confirmar", "Email" → "A confirmar", "Ubicación" → "Dirección a confirmar", "Horarios" → "Lunes a viernes, horario a confirmar".
2. Copyright: Caption 11/14 Medium, `text/tertiary`. Texto: "© 2026 Nexa Seguros. Todos los derechos reservados."

Props propuestas:

```ts
interface PublicFooterProps {
  contacto: ReadonlyArray<{ label: string; value: string }>;
  copyright: string;
}
```

Nota: los valores "A confirmar" son texto de muestra del diseño, no contenido final.

### 5.12 Table/Header y Table/Row

**Nodos Figma**: `15:62` (Table/Header) y `15:78` (Table/Row).

Descripción en Figma para Table/Header: "Table header on surface/subtle with 12px top radius. Pair with Table/Row. Columns are equal width (layoutGrow)." Descripción para Table/Row: "Table row with hairline bottom divider. Use the Badge/Estado instance for Renaper and DNRPA states, Nexa/Mono for identifiers."

Medidas (F0, muestra):

| Columna | Ancho (px) | Header (texto) | Celda (estilo) |
|---|---|---|---|
| Nombre | 160 | Label, `text/secondary` | Body-sm, `text/primary` |
| DNI | 110 | Label, `text/secondary` | Mono 13/18, `text/primary` |
| Email | 200 | Label, `text/secondary` | Body-sm, `text/primary` |
| Teléfono | 120 | Label, `text/secondary` | Body-sm, `text/primary` |
| Vehículos | 100 | Label, `text/secondary` | Body-sm, `text/primary` |
| Renaper | 120 | Label, `text/secondary` | Badge/Estado |
| Pólizas activas | 94 | Label, `text/secondary` | Body-sm, `text/primary` |
| Menú | 24 | (vacío) | Ícono `dots-three` 16px |

Suma de columnas: 928px. Con padding horizontal de 16px a cada lado da 960px, que es el ancho de la celda de fila. El ancho del header y de la fila en F0 es 1344px. El espacio sobrante queda a la derecha.

Table/Header:
- Alto 40px, padding horizontal 16px, fondo `surface/subtle`, radio superior 12px.

Table/Row:
- Alto 48px de celdas, padding horizontal 16px, divisor inferior 1px `border/hairline`.
- Las celdas se alinean al centro vertical.

Props propuestas:

```ts
interface TableColumn<T> {
  key: keyof T & string;
  header: string;
  width: number;                // px fijos del diseño; ver sección 9 sobre layoutGrow
  render?: (row: T) => React.ReactNode;
  mono?: boolean;               // true para DNI, pólizas
}

interface TableProps<T> {
  columns: ReadonlyArray<TableColumn<T>>;
  rows: ReadonlyArray<T>;
  getRowKey: (row: T) => string;
  onRowMenu?: (row: T) => void; // ícono dots-three
}
```

### 5.13 Card/Widget

**Nodo Figma**: `15:49` ("Card/Widget"). Descripción en Figma: "Widget container: 16px radius, hairline border, no shadow. Title plus optional action link. Use only where grouping matters."

Dimensiones: 360px de ancho (muestra), alto por contenido. Padding 20px. Gap 16px. Radio card (16px). Borde 1px `border/hairline`. Fondo `surface/panel`. Sin sombra.

Anatomía:
1. Encabezado (fila, `justify-between`):
   - Título: H3 16/22 SemiBold, `text/primary`.
   - Acción opcional (gap 4px): ícono `arrow-up-right` 16px + texto Label 12/16 Medium `text/primary`. Muestra: "Ver todo".
2. Contenido: Body-sm 13/18, `text/secondary`.

Props propuestas:

```ts
interface CardWidgetProps {
  title: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}
```

### 5.14 Backdrop

**Nodo Figma**: `15:102` ("Backdrop"). Muestra: 1440 × 1024. Degradado definido en sección 3.5.

Props propuestas:

```ts
interface BackdropProps {
  children: React.ReactNode;
}
```

Implementación: un `div` con `bg-backdrop`, `min-h-dvh`. No usar alto fijo de 1024. Es un frame de muestra.

### 5.15 Shell

**Nodo Figma**: `15:104` ("Shell"). Descripción en Figma: "Floating white app shell: 24px radius, only element with a drop shadow (Nexa/Shadow/Shell). Sits 24px inside the Backdrop."

Dimensiones:
- Muestra en F0: 1392 × 976.
- Web W3 (`18:49`): 1392 × 1326. El alto depende del contenido.
- Móvil W2m (`18:152`): 358 × 1044, en un Backdrop de 390 × 1076. Inset de 16px.
- Backoffice B2 (`18:238`): 1392 × 976.

Anatomía: fondo `surface/panel`, radio `radius/shell` (24px), sombra `shadow-shell`. Sin padding propio. El contenido lo define cada pantalla.

Inset respecto del Backdrop: 24px en desktop (1440), 16px en móvil (390).

Props propuestas:

```ts
interface ShellProps {
  variant?: 'desktop' | 'mobile';   // define el inset: 24 o 16
  children: React.ReactNode;
}
```

---

## 6. Íconos

### 6.1 Librería

Figma no declara una librería, pero la descripción del componente NavItem indica: "Icon is a Phosphor Regular glyph." Los nombres de los layers ("magnifying-glass", "dots-three", "caret-down", "user-circle") son nombres Phosphor, no lucide. Lucide usa otros nombres para los mismos glifos (`search`, `ellipsis`, `chevron-down`, `circle-user`).

**Recomendación**: `@phosphor-icons/react`, peso `regular`, tamaño 16px, un import por ícono para tree-shaking.

Verificado con la documentación de Phosphor (Context7, `/phosphor-icons/react`): los componentes se importan con sufijo `Icon` (por ejemplo `HorseIcon`), aceptan `weight`, `size` y `color`, y el peso `regular` es el default. La conversión layer → componente que aparece abajo sigue esa convención (PascalCase + `Icon`). Los nombres marcados con `(verificar)` deben confirmarse al importar.

Uso:

```tsx
import { HouseIcon } from '@phosphor-icons/react/dist/csr/House';

<HouseIcon size={16} weight="regular" aria-hidden="true" />
```

### 6.2 Lista de íconos del diseño

Uso en F0 (código de referencia de `get_design_context`):

| Layer Figma | Componente propuesto | Dónde se usa |
|---|---|---|
| `house` | `HouseIcon` | NavItem Inicio (inactivo y activo) |
| `users` | `UsersIcon` | NavItem Clientes |
| `car` | `CarIcon` | NavItem Vehículos |
| `calculator` | `CalculatorIcon` | NavItem Cotizaciones |
| `file-text` | `FileTextIcon` | NavItem Pólizas |
| `receipt` | `ReceiptIcon` | NavItem Pagos y facturas |
| `barcode` | `BarcodeIcon` | NavItem Pago Fácil |
| `list` | `ListIcon` | NavItem Planes |
| `user-circle` | `UserCircleIcon` | NavItem Usuarios |
| `magnifying-glass` | `MagnifyingGlassIcon` | Buscador de Sidebar y Topbar |
| `bell` | `BellIcon` | Bell del Topbar |
| `dots-three` | `DotsThreeIcon` | Menú del usuario en Sidebar; menú de fila en Table/Row |
| `caret-down` | `CaretDownIcon` | Select |
| `arrow-up-right` | `ArrowUpRightIcon` | Acción de Card/Widget |
| `plus` | `PlusIcon` | Botón con ícono |

Íconos que aparecen en la metadata de las páginas Web y Backoffice (nombres de layer, sin contexto de uso completo):

| Layer Figma | Componente propuesto | Ocurrencias (aprox.) |
|---|---|---|
| `arrow-left` | `ArrowLeftIcon` | 4 |
| `caret-right` | `CaretRightIcon` | 2 |
| `check-circle` | `CheckCircleIcon` | 5 |
| `calendar-blank` | `CalendarBlankIcon` | 1 |
| `car-profile` | `CarProfileIcon` (verificar) | 1 |
| `download-simple` | `DownloadSimpleIcon` | 3 |
| `identification-card` | `IdentificationCardIcon` | 1 |
| `menu` | `MenuIcon` (verificar) | 1 |
| `motorcycle` | `MotorcycleIcon` | 1 |
| `pencil-simple` | `PencilSimpleIcon` | 5 |
| `shield-check` | `ShieldCheckIcon` | 1 |
| `trash` | `TrashIcon` | 1 |
| `user-plus` | `UserPlusIcon` | 3 |
| `wallet` | `WalletIcon` | 1 |
| `warning` | `WarningIcon` | 1 |
| `warning-circle` | `WarningCircleIcon` | 1 |
| `x-circle` | `XCircleIcon` | 2 |

Las ocurrencias son conteos de nombres de layer en la metadata que se pudo leer. Es un inventario parcial de las páginas Web y Backoffice, no una lista cerrada. Los íconos de la segunda tabla no se revisaron uno por uno en pantalla.

---

## 7. Layout

### 7.1 Ancho máximo y grilla

- Frame de escritorio: 1440px. Backdrop de 1440 con Shell a 24px.
- Shell interno (desktop): 1392px de ancho útil.
- En la web pública (W3): el contenido tiene padding horizontal de **40px**. Encabezado en x=40, Principal en x=40 con ancho 1312px (1392 − 2 × 40).
- No hay máximo de ancho definido en Figma para el contenido. Se usa el ancho del Shell.

### 7.2 Estructura Shell del backoffice (B2)

Medidas tomadas de la metadata de `18:236` (B2 Inicio, frame 1440×1024):

| Elemento | x | y | Ancho | Alto | Nota |
|---|---|---|---|---|---|
| Backdrop | 0 | 0 | 1440 | 1024 | |
| Panel shell | 24 | 24 | 1392 | 976 | Shell con sombra |
| Sidebar (instancia) | 0 | 0 | 232 | 976 | Relativo al Shell. Pegado a la izquierda, sin inset, alto completo. |
| Columna principal | 232 | 0 | 859 | 976 | Relativo al Shell |
| Topbar (instancia) | 32 | 32 | 795 | 64 | Relativo a la columna principal |
| Saludo | 32 | 120 | 795 | 58 | |
| KPIs | 32 | 202 | 795 | 158 | |
| Widget cuotas vencidas | 32 | 384 | 795 | 361 | |
| Divider rail | 1091 | 0 | 1 | 976 | Relativo al Shell |
| Rail derecho | 1092 | 0 | 300 | 976 | Relativo al Shell |
| Widget pólizas por estado | 24 | 24 | 252 | 370 | Relativo al rail |

Lectura de la estructura:
- Sidebar (232) + columna principal (859) + divisor (1) + rail derecho (300) = 1392.
- Padding de la columna principal: 32px a la izquierda, arriba y a la derecha (859 − 32 − 795 = 32).
- Padding del rail: 24px.

Para B1 a B14 se debe verificar cada pantalla antes de fijar el layout. Solo se midió B2.

### 7.3 Estructura Shell de la web pública (W3)

- Shell: 1392 × 1326 (el alto depende del contenido).
- PublicNav: 1392 × 72 arriba.
- Contenido: y=72, alto 1116, padding horizontal 40px.

### 7.4 Breakpoints

Figma solo tiene dos anchos de diseño:
- **390px** (móvil, frames W2m y W3m). Backdrop 390 × 1076, Shell con inset de 16px (358px de ancho útil).
- **1440px** (escritorio, todos los demás frames).

No hay frames de 768px ni de 1024px. Breakpoints propuestos (**propuesta**, no están en el diseño):
- Móvil: hasta 767px. Inset 16px. Sidebar oculto y navegación por otra vía. Pendiente de definir.
- Escritorio: desde 768px. Inset 24px, sidebar visible. Desde 1280px el layout del diseño se mantiene.

Esta propuesta debe confirmarse con diseño (sección 9).

---

## 8. Accesibilidad

### 8.1 Contraste: pares problemáticos

| Par | Uso | Ratio | Resultado | Recomendación |
|---|---|---|---|---|
| `text/tertiary` (#8A8E93) sobre `surface/panel` (#FFFFFF) | Helper de Input/Select, placeholder, Caption del footer, rol del usuario sobre panel | **3.30** | **No cumple AA** (4.5). Solo cumpliría texto grande o de 3:1. | Usar `text/secondary` (6.33) para texto informativo. Reservar `text/tertiary` para deshabilitado y decorativo. |
| `text/tertiary` sobre `surface/sidebar` (#F5F5F2) | Rol "Empleado" del usuario en Sidebar | **3.02** | **No cumple AA** | Usar `text/secondary` (5.79 sobre sidebar). |
| `text/tertiary` sobre `surface/subtle` | Campo deshabilitado | 2.93 | Exento por ser deshabilitado (WCAG 1.4.3 excluye componentes inactivos) | Sin acción obligatoria. |
| `status/suspendida/text` sobre `status/suspendida/bg` | Badge Suspendida y Pendiente CAE | **4.42** | **No cumple AA** por 0.08 | Oscurecer `status/suspendida/text` hasta ≥4.5 sobre `#FBF0D6`. Revalidar con el validador del equipo. |
| `border/strong` (#D3D5CE) sobre panel | Borde de Input/Select por defecto | **1.48** | No cumple 1.4.11 (3:1) si el borde es la única señal del campo | Subir el borde de Input/Select a un token de ≥3:1 sobre panel, o agregar un fondo distinto. Revisar con diseño. |
| `border/hairline` (#E7E8E3) sobre panel | Card/Widget, divisores | 1.23 | Decorativo, no identifica componente | Sin acción si el card no es interactivo. |
| `action/primary` sobre panel | Foco de Input/Select (2px) | 17.61 | Cumple | Ninguna. |
| `status/cancelada/text` sobre panel | Borde y helper de error | 6.02 | Cumple | Ninguna. |
| `text/primary` sobre `accent/lime` | Chip Destacado | 13.54 | Cumple | Ninguna. |
| `action/on-primary` sobre `action/primary` | Botón primario | 17.61 | Cumple | Ninguna. |

Ratios completos de estados y de texto de estado: ver sección 1.1.

### 8.2 Estado de error de Input y Select

En Figma, el helper de error usa el mismo texto que el helper por defecto ("Los datos figuran en tu póliza."). El estado Error cambia el color (rojo) y el borde, pero el texto no explica el error. Para WCAG 3.3.1 (identificación de errores) se requiere un mensaje de error específico. El color por sí solo no basta (1.4.1).

Recomendación: el prop `helper` en estado error debe recibir un mensaje específico (por ejemplo "El DNI debe tener 7 u 8 dígitos"). El diseño debe definir ese texto.

### 8.3 Foco visible

- **Input y Select**: Figma define foco con borde de 2px `action/primary` (17.61:1). Cumple.
- **Button, Chip, NavItem, Table/Row, Bell**: Figma no define estado de foco. No hay estados hover ni pressed en ningún componente.

Propuesta para componentes interactivos sin foco en Figma (**propuesta**):
- `focus-visible`: anillo de 2px `action/primary` con `outline-offset: 2px`, aplicado con `focus-visible:outline` de Tailwind.
- No quitar nunca el outline sin reemplazo.

### 8.4 Salto de layout en foco de Input

El borde pasa de 1px (Default) a 2px (Focus). Si el borde no está incluido en el alto de 40px (`box-sizing: border-box`), el contenido se mueve 1px. Recomendación: usar `box-sizing: border-box` (default de Tailwind) y, si el salto se nota, reemplazar el cambio de borde por `ring` interior de 1px adicional, manteniendo el borde de 1px.

### 8.5 Tamaños táctiles

WCAG 2.5.8 (AA) exige 24×24px mínimo. WCAG 2.5.5 (AAA) pide 44×44px.

| Elemento | Alto visual | ¿Cumple 24px? | Observación |
|---|---|---|---|
| Button S | 32px | Sí | |
| Button M | 40px | Sí | |
| NavItem | 32px | Sí | Ancho 200px |
| Chip | 28px | Sí | |
| Badge | 24px | Sí | No es interactivo |
| Bell | 36px | Sí | |
| Input / Select | 40px | Sí | |

Propuesta para mobile (**propuesta**): área de toque de 44px mediante padding invisible o `min-h-11` en elementos interactivos (Button, NavItem, Chip seleccionable, Bell). Los estilos visuales no cambian.

### 8.6 Otros puntos

- **Idioma**: los textos de UI están en español. Declarar `lang="es"` en el HTML de cada app.
- **Íconos decorativos**: el ícono de un botón con texto debe tener `aria-hidden="true"`. Un ícono solo, como el bell, necesita `aria-label` en el botón.
- **Avatar**: las iniciales "MQ" son texto visible. No hace falta `aria-label` si el nombre completo aparece al lado.

---

## 9. Dudas

Cada duda indica qué se midió, qué no se pudo confirmar y quién debe resolverla.

1. **Color de los íconos (activo vs inactivo, Primary vs Secondary/Ghost)**. Figma usa assets SVG distintos para algunos íconos (por ejemplo `house` y `house1`; el botón Primary usa un asset y Secondary/Ghost otro). No se descargaron los SVG (regla del flujo, solo se descargan capturas si hace falta). No se puede confirmar qué color tiene cada asset. Propuesta: heredar `currentColor` y usar `text-action-on-primary` en Primary y `text-text-primary` en Secondary/Ghost. Confirmar con diseño.

2. **Ícono activo del NavItem**. En el código de referencia, solo `house` tiene un asset distinto para estado activo. Los demás ítems activos usan el mismo asset y solo cambian el texto a `text/primary` y aparece el indicador. Confirmar si es intencional.

3. **Anchos de la tabla**. La descripción de `Table/Header` dice "Columns are equal width (layoutGrow)". El código de referencia muestra anchos fijos (160/110/200/120/100/120/94/24). Los dos no coinciden. Además, el contenedor de celdas de la fila mide 960px mientras el header y la fila miden 1344px. Confirmar qué regla aplica.

4. **Token del borde del buscador**. El buscador del Topbar usa `border/strong`, y el del Sidebar usa `border/hairline`. Confirmar si son intencionalmente distintos.

5. **Letra de la marca "N"**. Es Plus Jakarta Sans Bold 16px con line-height `normal`. No pertenece a los 10 estilos del sistema. Confirmar si se agrega un estilo o si la marca es un SVG.

6. **Tokens de spacing 20 y 40**. Existen como variables (`--nexa-spacing-20`, `--nexa-spacing-40`) pero no aparecen en la muestra de F0. Se usan en Card/Widget (20) y PublicFooter (40). Confirmar que son tokens oficiales y no restos.

7. **Estados no diseñados**. No hay hover, pressed, disabled ni focus para Button (salvo Disabled de Input y Select), Chip, NavItem ni Table/Row. Confirmar si existen en otra página o si no se diseñaron.

8. **Pedidos de contraste a diseño (registro de US-FE-T-19, FB7.8, RV-D25).** Se implementan los tokens como están en el Figma; nadie cambia colores por su cuenta. Pedidos abiertos a diseño:
   - P-C1. `text/tertiary` (#8A8E93) sobre `surface/panel`: 3.30, no cumple AA (4.5). Pedido: `text/secondary` (6.33) para texto informativo. Estado: pendiente de diseño.
   - P-C2. `text/tertiary` sobre `surface/sidebar` (rol "Empleado" en el Sidebar): 3.02. Pedido: `text/secondary` (5.79). Estado: pendiente de diseño.
   - P-C3. `status/suspendida/text` sobre `status/suspendida/bg` (Badge Suspendida y Pendiente CAE): 4.42. Pedido: oscurecer hasta ≥4.5 sobre #FBF0D6. Estado: pendiente de diseño.
   - P-C4. `border/strong` (#D3D5CE) sobre panel (borde de Input y Select): 1.48, no cumple 1.4.11. Pedido: token de borde ≥3:1 o fondo distinto. Estado: pendiente de diseño.
   - Sin acción: texto tertiary deshabilitado (2.93, exento), `border/hairline` decorativo (1.23), foco de Input/Select (17.61), error (6.02), Chip Destacado (13.54) y botón primario (17.61).

8. **Mensaje de error de Input y Select**. El helper de error reutiliza el texto de ayuda por defecto. Ver sección 8.2.

9. **Alto del Sidebar**. En F0 mide 960px, en B2 976px. Confirmar si el alto es el del Shell (976) y la muestra de F0 es incorrecta.

10. **Alto del Shell**. En F0 es 976px. En W3 es 1326px. Confirmar que el alto es siempre variable por contenido, salvo en las muestras.

11. **Padding del Sidebar en B2**. No se midió el padding interno de la instancia de B2. Se asume 16px por la muestra de F0. Confirmar.

12. **Breakpoints intermedios**. Solo hay frames de 390px y 1440px. No hay 768 ni 1024. Ver sección 7.4.

13. **Inset móvil del Shell**. Está medido en W2m (16px). No se midieron W3m ni los demás frames móviles. Confirmar que el inset es 16px en todos.

14. **Valores de estado vs enum del back**. Los nombres de estado del Badge (Pendiente, Vigente, Suspendida, Cancelada, Vencida, Pagada, Anulada, Validado, Pendiente CAE) deben coincidir con el enum del back. No se verificó contra `contratos-api/`. Confirmar antes de fijar el tipo `EstadoBadgeValue`.

15. **Sufijos de nombres Phosphor**. Los nombres marcados `(verificar)` en la sección 6 son inferidos de la convención de nombres y no se confirmaron uno por uno en el paquete. Confirmar al primer import.

16. **Textos de muestra**. Los nombres "Tomás Iturralde", "Mariela Quiroga", los importes ("$ 25.000,00") y los valores "A confirmar" son contenido de muestra del diseño. No deben implementarse como texto fijo.

17. **Licencia de las fuentes**. Plus Jakarta Sans y JetBrains Mono son de Google Fonts (SIL OFL). Figma no declara la fuente de origen. Confirmar que el diseño usa esas versiones y no una licencia comercial.
