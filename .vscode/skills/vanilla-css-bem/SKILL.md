# Skill: Vanilla CSS BEM

**Trigger:** Cuando el archivo termina en `.css`.

## 🧠 Paso 0: Recuperación de Contexto (Engram)
- REQUIRE: ANTES de crear nuevas clases, utiliza `mem_search` para buscar qué "Blocks" BEM ya existen en este módulo o si hay variables de diseño específicas guardadas en memoria para evitar duplicar estilos.

## 📜 Reglas Estrictas (Diseño Escalable)
- REQUIRE **Metodología:** Usa el estándar BEM (Block__Element--Modifier) obligatoriamente para aislar estilos y evitar colisiones globales.
- REQUIRE **Idioma de Clases:** Todas las clases y variables CSS DEBEN estar en INGLÉS. Ejemplo: `.appointment-list`, `.appointment-list__item--active`, `var(--color-primary)`.
- REQUIRE **Variables:** Debes consumir la paleta de colores y espaciados usando las variables globales de `shared/styles/variables.css`.
- REQUIRE **Comentarios:** Los comentarios estructurales o explicativos deben estar en ESPAÑOL (ej. `/* Estilos para la lista de citas */`).

## 🚫 Anti-patrones (PROHIBIDOS)
- REJECT if: Usas selectores de etiqueta globales (`div`, `span`, `p`, `button`) dentro de las features. Todo estilo debe estar atado a una clase BEM.
- REJECT if: Excedes 2 niveles de anidamiento o anidas clases rompiendo BEM (ej. `.block .element .sub-element`). Mantén la especificidad plana.
- REJECT if: Usas `!important`. Está estrictamente prohibido a menos que modifiques una clase de utilidad documentada y justificada.

## 💾 Paso Final: Persistencia de Artefactos (Engram)
Como subagente, debes documentar tu trabajo para que el subagente encargado de la Vista (.view.js) sepa qué clases HTML puede usar.
- REQUIRE: Al terminar, usa OBLIGATORIAMENTE la herramienta `mem_save` para registrar los nuevos "Blocks" BEM principales que creaste y su propósito.
- PREFER: Utiliza siempre un `topic_key` estructurado (ej. `css-bem/[nombre-del-bloque]`) para que las actualizaciones futuras sobre este componente actualicen la memoria (upsert) en lugar de duplicarla.