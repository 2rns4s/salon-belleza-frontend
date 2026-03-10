# Skill: Vanilla CSS BEM

**Trigger:** Cuando el archivo es `.css`.

## Reglas Estrictas:
1. **Metodología:** Usa BEM (Block__Element--Modifier) obligatoriamente para evitar colisiones globales.
2. **Idioma de Clases:** Todas las clases deben estar en **INGLÉS**. Ejemplo: `.appointment-list`, `.appointment-list__item`, `.appointment-list__item--active`.
3. **Variables:** Usa variables CSS (`var(--color-primary)`) obtenidas de `shared/styles/variables.css`. Las variables también deben estar en inglés.
4. **Prohibiciones:** NO uses selectores de etiqueta globales (`div`, `span`, `p`) dentro de las features para dar estilo, usa SIEMPRE clases BEM.
5. **Comentarios:** Los comentarios que expliquen secciones de CSS deben estar en **ESPAÑOL** (ej. `/* Estilos para la lista de citas */`).