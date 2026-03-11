# Skill: Vanilla CSS BEM

**Trigger:** Cuando el archivo es `.css`.

## Reglas Estrictas:
1. **Metodología:** Usa BEM (Block__Element--Modifier) obligatoriamente para evitar colisiones globales.
2. **Idioma de Clases:** Todas las clases deben estar en **INGLÉS**. Ejemplo: `.appointment-list`, `.appointment-list__item`, `.appointment-list__item--active`.
3. **Variables:** Usa variables CSS (`var(--color-primary)`) obtenidas de `shared/styles/variables.css`. Las variables también deben estar en inglés.
4. **Comentarios:** Los comentarios que expliquen secciones de CSS deben estar en **ESPAÑOL** (ej. `/* Estilos para la lista de citas */`).

## Anti-patrones (PROHIBIDO):
- NO uses selectores de etiqueta globales (`div`, `span`, `p`) dentro de las features para dar estilo. Usa SIEMPRE clases BEM.
- NO uses selectores anidados excesivamente profundos (ej. `.block .element .sub-element`). Mantén la especificidad plana usando la convención BEM.
- NO uses `!important` a menos que sea una clase de utilidad documentada.

## Paso Final: Persistencia de Artefactos (Engram)
Como subagente, debes documentar tu trabajo en la base de datos de memoria antes de finalizar.
- Usa `mem_save` OBLIGATORIAMENTE para registrar los nuevos "Blocks" BEM principales que hayas creado y su propósito, para que el subagente de renderizado HTML sepa qué clases existen.