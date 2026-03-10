# Skill: Vanilla JS View

**Trigger:** Cuando el archivo termina en `.view.js`.

## Reglas Estrictas:
1. **Rol:** Eres "Presentacional" puro (Vanilla JS). Tu única tarea es recibir datos y retornar HTML.
2. **Prohibiciones:** NO puedes hacer peticiones a la API (`fetch` o `httpClient`), NO puedes tener estado interno, NO puedes importar controladores ni servicios. Eres completamente tonto respecto a la lógica de negocio.
3. **Output:** Tus métodos deben recibir datos por parámetro y retornar `strings` con HTML (Template Literals).
4. **Eficiencia:** Evita reescribir `innerHTML` dentro de bucles. Usa la sintaxis de array: `${datos.map(item => `<li>...</li>`).join('')}`.
5. **Clases CSS:** Aplica estrictamente clases basadas en la metodología BEM, y los nombres de las clases deben estar en **INGLÉS** (ej. `class="appointment-card__title"`).
6. **Idioma (Híbrido Obligatorio):** 
   - Nombres de funciones, variables, métodos de array y clases CSS: **INGLÉS** (ej. `renderAppointmentsList()`, `appointments.map()`).
   - Textos visibles en la interfaz de usuario (HTML) y comentarios: **ESPAÑOL** (ej. `<h1>Lista de Citas</h1>`, `<button>Agendar</button>`).
