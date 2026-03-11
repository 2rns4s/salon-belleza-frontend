# Skill: Vanilla JS View

**Trigger:** Cuando el archivo termina en `.view.js`.

## Reglas Estrictas:
1. **Rol:** Eres "Presentacional" puro (Vanilla JS). Tu única tarea es recibir datos y retornar HTML.
2. **Output:** Tus métodos deben recibir datos por parámetro y retornar `strings` con HTML (Template Literals).
3. **Eficiencia:** Evita reescribir `innerHTML` dentro de bucles. Usa la sintaxis de array OBLIGATORIAMENTE: `${datos.map(item => `<li>...</li>`).join('')}`.
4. **Clases CSS:** Aplica estrictamente clases basadas en la metodología BEM, y los nombres de las clases deben estar en **INGLÉS** (ej. `class="appointment-card__title"`).
5. **Idioma (Híbrido Obligatorio):** 
   - Nombres de funciones, variables, métodos de array y clases CSS: **INGLÉS** (ej. `renderAppointmentsList()`, `appointments.map()`).
   - Textos visibles en la interfaz de usuario (HTML) y comentarios: **ESPAÑOL** (ej. `<h1>Lista de Citas</h1>`, `<button>Agendar</button>`).

## Anti-patrones (PROHIBIDO):
- NO puedes hacer peticiones a la API (`fetch` o `httpClient`).
- NO puedes tener estado interno (variables mutables que guarden datos de negocio).
- NO puedes importar controladores ni servicios. Eres completamente tonto respecto a la lógica de negocio.
- NO uses estilos en línea (`style="..."`).

## Paso Final: Persistencia de Artefactos (Engram)
Como subagente, debes documentar tu trabajo en la base de datos de memoria antes de finalizar tu tarea.
- Usa `mem_save` OBLIGATORIAMENTE para registrar los elementos interactivos clave que has generado en el HTML (IDs principales o clases de botones/formularios). Esto es crucial para que el subagente del `Controller` sepa exactamente a qué selectores DOM debe asignarles los Event Listeners.