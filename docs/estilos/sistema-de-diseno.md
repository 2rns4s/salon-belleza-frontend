# Sistema visual y convenciones de estilos

El proyecto dispone de tokens globales de color, estilos base y componentes por feature con BEM. Esto constituye una base visual compartida, no un design system completo: no hay escalas formalizadas de spacing y tipografía ni un catálogo versionado de componentes.

## Fuente de verdad

Los tokens vigentes se definen en `src/shared/styles/global.css`. Los estilos específicos viven junto a cada feature. Este documento explica su uso; los valores deben cambiarse primero en CSS y después actualizarse aquí.

## Tokens globales

### Superficies, texto y marca

| Token | Valor | Uso semántico observado |
|---|---|---|
| `--color-fondo-principal` | `#f8f3f4` | Fondo general. |
| `--color-texto-principal` | `#2c1a1e` | Texto principal. |
| `--color-superficie` | `#ffffff` | Superficie de contenido. |
| `--color-header-vinotinto-claro` | `#8a3f52` | Header y color de marca. |
| `--color-texto-inverso` | `#ffffff` | Texto sobre fondos oscuros. |
| `--color-texto-secundario` | `#4a4a4a` | Texto secundario. |
| `--color-surface-alt` | `#fff5f7` | Superficie alternativa. |
| `--color-surface-hover` | `#fffaf8` | Hover de superficies. |
| `--color-input-border` | `#d1b8be` | Bordes de controles. |

### Variantes vinotinto

| Token | Valor |
|---|---|
| `--color-vinotinto-hover` | `#72333e` |
| `--color-vinotinto-soft` | `#f3e8eb` |
| `--color-vinotinto-border` | `#eadde0` |
| `--color-vinotinto-contrast` | `#5c3344` |
| `--color-vinotinto-muted` | `#6b4a52` |
| `--color-vinotinto-subtle` | `#9e7a85` |
| `--color-vinotinto-gradient-start` | `#fff7f8` |
| `--color-vinotinto-gradient-end` | `#fffcf7` |

### Feedback, roles y estados

| Token | Valor | Propósito |
|---|---|---|
| `--color-feedback-error-bg` | `#fdecea` | Fondo de error. |
| `--color-feedback-error-text` | `#b71c1c` | Texto de error. |
| `--color-feedback-error-border` | `#f5c6cb` | Borde de error. |
| `--color-feedback-success-bg` | `#e8f5e9` | Fondo de éxito. |
| `--color-feedback-success-text` | `#1b5e20` | Texto de éxito. |
| `--color-feedback-success-border` | `#c8e6c9` | Borde de éxito. |
| `--color-role-owner` | `#7b1fa2` | Identificación visual de `OWNER`. |
| `--color-role-receptionist` | `#1976d2` | Identificación visual de `RECEPTIONIST`. |
| `--color-status-active` | `#388e3c` | Estado activo. |
| `--color-status-inactive` | `#9e9e9e` | Estado inactivo. |
| `--color-action-danger` | `#c62828` | Acción destructiva. |
| `--color-action-danger-hover` | `#a31515` | Hover destructivo. |
| `--color-warning-text` | `#e65100` | Advertencia. |

### Capas y foco

| Token | Valor |
|---|---|
| `--color-overlay-scrim` | `rgba(0, 0, 0, 0.45)` |
| `--color-shadow-elevated` | `rgba(0, 0, 0, 0.18)` |
| `--color-focus-ring` | `rgba(138, 63, 82, 0.15)` |

Los nombres expresan intención parcial, pero no se ha auditado el contraste de todas las combinaciones. Un valor definido no implica conformidad WCAG.

## Base global

`global.css` aplica:

- `box-sizing: border-box` y reinicio de margen/padding.
- Altura mínima de documento.
- Imágenes y SVG responsivos mediante `max-width: 100%`.
- Herencia tipográfica en controles.
- Fuente del sistema: `"Segoe UI", Tahoma, Geneva, Verdana, sans-serif`.
- `line-height: 1.5`.
- Bloque de layout `app` con header, título, contenido y texto.

No existe una escala tipográfica formal; los tamaños observados son decisiones locales o base.

## Convención BEM

Formato:

```text
.block
.block__element
.block__element--modifier
```

Ejemplos vigentes:

```css
.app {}
.app__header {}
.app__title {}
.app__content {}
.citas__... {}
.appointments__... {}
```

### Compatibilidad temporal de citas

El módulo de citas conserva bloques en español (`citas`, `citas__*`) y aliases en inglés (`appointments`, `appointments__*`). `appendAppointmentsBEMAliases()` agrega las clases compatibles y `appointments.alias.css` mantiene selectores alternos.

Esta duplicidad es deuda controlada. No debe retirarse un conjunto hasta comprobar markup, CSS y pruebas que dependan de los nombres legacy.

## Patrones de componentes

Aunque no hay catálogo formal, se observan patrones reutilizados conceptualmente:

| Patrón | Función |
|---|---|
| Layout de aplicación | Header y contenedor principal montados por el componente compartido. |
| Formularios | Labels, inputs, selectores, validación de campo y acciones. |
| Feedback | Estados de error, éxito, carga y vacío. |
| Tablas o listados | Presentación de entidades administrativas. |
| Controles de agenda | Filtros, franjas y estados de citas. |
| Diálogos/overlays | Confirmaciones o acciones contextuales en features que los implementan. |
| Badges de rol/estado | Diferenciación mediante tokens específicos. |

Cada patrón debe conservar HTML semántico, nombre accesible, foco visible y estados que no dependan únicamente del color.

## Responsive

La estrategia es CSS nativo por feature con imágenes fluidas, layout adaptable y media queries locales. El módulo de citas incluye controles táctiles de 44 px en puntos relevantes. La existencia de estas reglas es evidencia parcial: faltan pruebas sistemáticas en una matriz de dispositivos, zoom y navegadores reales.

## Reglas para cambios visuales

1. Reutilizar un token semántico existente antes de introducir un color equivalente.
2. Si falta un token, nombrarlo por intención y definirlo en `:root`; evitar nombres ligados a una pantalla.
3. Mantener estilos de feature junto al módulo y estilos transversales en `shared/styles`.
4. Seguir BEM y evitar selectores globales que dependan de la estructura interna de otra feature.
5. Incluir estados `hover`, `focus`, `disabled`, `error`, `success` y responsive cuando correspondan.
6. Comprobar contraste y teclado; no afirmar WCAG a partir de inspección visual.
7. Actualizar este inventario cuando cambie la fuente CSS.

## Trabajo pendiente para un design system formal

- Definir escalas de spacing, tipografía, radios, sombras y elevación.
- Documentar componentes, variantes, estados y contratos de accesibilidad.
- Auditar contraste de tokens y combinaciones.
- Unificar la nomenclatura BEM después de retirar aliases de citas.
- Añadir pruebas visuales y de navegadores reales.

Referencias: [Convenciones](../desarrollo/convenciones.md) y [Accesibilidad y usabilidad](../calidad/accesibilidad-y-usabilidad.md).