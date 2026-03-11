# Skill: Vanilla JS View

**Trigger:** Cuando el archivo termina en `.view.js`.

## 🧠 Paso 0: Recuperación de Contexto (Engram)
- REQUIRE: ANTES de empezar a generar el HTML, utiliza `mem_search` para buscar qué clases BEM ya fueron registradas en memoria por el subagente de CSS (`.css`), para que uses exactamente los mismos nombres y no inventes estilos nuevos.

## 📜 Reglas Estrictas (Capa Presentacional)
- REQUIRE **Rol:** Eres "Presentacional" puro (Vanilla JS). Tu única tarea es recibir datos inyectados por parámetro y retornar strings con HTML.
- REQUIRE **Output y Eficiencia:** Tus métodos deben retornar Template Literals. Evita reescribir `innerHTML` dentro de bucles. Usa la sintaxis de array OBLIGATORIAMENTE unida sin comas: `${datos.map(item => `<li>...</li>`).join('')}`.
- REQUIRE **Clases CSS:** Aplica estrictamente clases basadas en la metodología BEM, y los nombres de las clases deben estar en INGLÉS (ej. `class="appointment-card__title"`).
- REQUIRE **Idioma (Híbrido Obligatorio):** 
   - Nombres de funciones, variables de renderizado y métodos: INGLÉS (ej. `renderAppointmentsList()`, `appointments.map()`).
   - Textos visibles en la interfaz de usuario (HTML) y comentarios: ESPAÑOL (ej. `<h1>Lista de Citas</h1>`, `<button>Agendar</button>`).

## 🚫 Anti-patrones (PROHIBIDOS)
- REJECT if: Haces peticiones a la API (`fetch` o `httpClient`). Eres completamente ciego respecto a la red.
- REJECT if: Guardas estado interno (variables mutables que almacenen datos de negocio). Toda la información a renderizar debe entrar por parámetros de la función.
- REJECT if: Importas controladores o servicios. Eres completamente ignorante respecto a la lógica de negocio.
- REJECT if: Usas estilos en línea (`style="..."`). Todo el diseño debe gestionarse a través de las clases BEM.

## 💾 Paso Final: Persistencia de Artefactos (Engram)
Como subagente, debes documentar tu trabajo para que el subagente del `Controller` sepa a qué elementos debe agregarles los `addEventListener`.
- REQUIRE: Usa `mem_save` OBLIGATORIAMENTE para registrar los elementos interactivos clave que has generado en tu HTML (IDs principales, clases de botones o formularios).
- PREFER: Utiliza siempre un `topic_key` estructurado (ej. `dom-selectors/[nombre-vista]`) para que las modificaciones futuras a esta vista actualicen (upsert) la memoria en lugar de crear registros duplicados.