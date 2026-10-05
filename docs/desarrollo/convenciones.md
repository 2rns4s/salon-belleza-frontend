# Convenciones de desarrollo

Estas convenciones describen el código vigente. Deben conservar la separación por feature y evitar afirmaciones arquitectónicas más fuertes que la implementación real.

## Principios de contribución

1. Mantener cada cambio dentro de la feature responsable.
2. Reutilizar infraestructura de `src/shared/` antes de crear una alternativa local.
3. Mantener la View responsable del DOM, el Controller de la orquestación y el Service del transporte.
4. Adaptar contratos externos en mappers o Services; no propagar variaciones de API a toda la UI.
5. Añadir o actualizar pruebas en la suite que corresponde al comportamiento.
6. Documentar límites y deuda sin presentar objetivos como capacidades implementadas.

## Nomenclatura observada

| Elemento | Convención | Ejemplo real |
|---|---|---|
| Carpetas de feature | sustantivo en minúsculas o kebab-case | `citas/`, `user-settings/` |
| Archivos | `<feature>.<responsabilidad>.js` | `auth.controller.js`, `citas.service.js` |
| Exports | funciones y objetos nombrados; no clases obligatorias | `initAuth`, `renderLoginPage`, `login` |
| Rutas | paths breves en minúsculas | `/auth`, `/mfa-setup`, `/user-settings` |
| Constantes agrupadas | `UPPER_SNAKE_CASE`, frecuentemente `Object.freeze` | `CITAS_ENDPOINTS`, `MFA_SETUP_STEPS` |
| Factories de endpoint | función dentro del catálogo | `userById(id)` |
| CSS | BEM `block__element--modifier` | `app__header`, `citas__...` |
| Pruebas | sufijo `.spec.js` | `mfa-active-guard.spec.js` |

No se usan clases como `LoginController` o rutas como `/login-page`; eran ejemplos históricos que no reflejaban el código funcional.

## JavaScript

- El proyecto usa ESM (`"type": "module"`) con `import` y `export` explícitos.
- Preferir `const`; usar `let` solo cuando el valor cambia.
- Mantener funciones pequeñas con responsabilidad observable y retornos explícitos.
- Utilizar optional chaining y valores por defecto cuando el contrato admite ausencia.
- Conservar el estilo del archivo: indentación de cuatro espacios, comillas dobles y comas finales en listas multilínea.
- No introducir un framework, bundler o nueva abstracción sin una decisión de arquitectura y actualización documental.
- Los comentarios deben explicar decisiones o restricciones; no repetir literalmente el código.

## Límite Controller / View / Service

| Pieza | Hace | Evita |
|---|---|---|
| Route | Registra handler y, cuando aplica, valida acceso local. | Renderizar lógica compleja. |
| Controller | Coordina eventos, estado, validación de flujo, Service y View. | Construir solicitudes HTTP directamente o consultar selectores dispersos. |
| View | Renderiza, enlaza eventos y expone helpers para leer el formulario. | Consumir API o decidir autorización. |
| Service | Forma payload/query y llama `httpClient`. | Manipular DOM. |
| Mapper | Normaliza entrada/salida y diferencias de nombres/tipos. | Ejecutar efectos de red o UI. |

Patrón de referencia: `readServicesFormState(container, fallbackForm)` pertenece a `servicios.view.js` y el Controller consume su resultado. Esta frontera evita scraping manual del DOM desde el Controller.

## Mappers y contratos

Antes de crear un helper, comprobar `src/shared/mappers/commonPrimitives.js`:

- `toTrimmedString(value)`
- `toNumber(value)`
- `getFirstValue(...candidates)`
- `buildFullName(firstName, lastName)`
- `normalizeDateTimeValue(value)`
- `toBackendLocalTime(value)`

Las variaciones de error deben pasar por `httpErrorNormalizer.js`, que reconoce mensajes en `message`, `mensaje`, `error` o `detail`, detalles y errores de campo. Los DTO completos del backend no deben copiarse como hechos sin una fuente verificable; consulte [Integración API](../api/integracion-api.md).

## Manejo de errores

1. El `httpClient` distingue timeout, fallo de red y respuesta HTTP no exitosa.
2. Los Services dejan que el error conserve `status` y `data` para normalización.
3. Controllers y Views presentan mensajes accionables definidos en constantes por feature.
4. `401` y `403` pueden activar el handler global que limpia sesión y navega a `/auth`.
5. Un `409` de citas indica que la disponibilidad pudo cambiar; la UI debe solicitar actualización, no asumir que la validación local es autoritativa.
6. No ocultar excepciones con mensajes de éxito ni inventar recuperación automática.

## Validación y seguridad en UI

- Validar formato para mejorar la experiencia, pero no sustituir reglas del backend.
- Escapar contenido dinámico antes de interpolarlo en HTML. Existe `src/shared/ui/escapeHtml.js` y helpers locales heredados; evitar nuevas duplicaciones.
- No registrar JWT, pre-auth tokens, secretos MFA ni datos personales en consola.
- No interpretar la decodificación del payload JWT como verificación de firma.
- Toda operación sensible debe seguir autorizada por el backend aunque la ruta tenga guarda de UI.

## CSS y BEM

- Usar tokens de `src/shared/styles/global.css` antes de introducir valores equivalentes.
- Mantener bloques por feature y modificadores explícitos.
- El módulo de citas conserva temporalmente clases `citas*` y aliases `appointments*`; cualquier retiro debe validar consumidores y pruebas.
- No afirmar que existe un design system completo: actualmente hay tokens de color, patrones y componentes visuales, pero no escalas formales de spacing o tipografía.

Consulte [Sistema de diseño](../estilos/sistema-de-diseno.md).

## Pruebas y verificación

- Las pruebas viven en `tests/smoke/` y `tests/integration/`; no existe una carpeta unitaria independiente.
- Limpiar DOM, hash y `localStorage` entre casos mediante el setup global.
- Para un cambio funcional, ejecutar primero la suite enfocada y luego los checks aplicables.
- `npm run build` es un check de sintaxis, no un build de distribución.
- No declarar cobertura alcanzada sin ejecutar coverage ni extrapolar jsdom a navegadores reales.

Comandos y límites: [Estrategia de pruebas](../calidad/estrategia-de-pruebas.md).