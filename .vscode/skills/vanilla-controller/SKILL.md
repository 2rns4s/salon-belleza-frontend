# Skill: Vanilla JS Controller

**Trigger:** Cuando el archivo termina en `.controller.js`.

## 🧠 Paso 0: Recuperación de Contexto (Engram)
- REQUIRE: ANTES de empezar a codificar, utiliza `mem_search` para buscar si existen decisiones arquitectónicas o reglas de negocio previas guardadas en memoria para este controlador (ej. "caché", "concurrencia", "AbortController").

## 📜 Reglas Estrictas (Clean Architecture)
- REQUIRE **Rol:** Eres el "Orquestador". Tu única responsabilidad es coordinar el flujo de datos y delegar tareas.
- REQUIRE **Importaciones:** Debes importar estrictamente el `.service.js` para obtención de datos y el `.view.js` para renderizado.
- REQUIRE **Flujo OBLIGATORIO:** 
   1. Captura la acción o estado inicial.
   2. Llama al servicio (gestionando cancelaciones de red si es necesario).
   3. Pasa los datos crudos a la vista.
   4. Inyecta el string devuelto por la vista al DOM (ej. `domContainer.innerHTML = view.render(...)`).
   5. Asigna los Event Listeners (`addEventListener`) ESTRICTAMENTE después de la inyección en el DOM.
- REQUIRE **Idioma:** 
   - Código (variables, funciones, selectores DOM): INGLÉS (ej. `fetchData()`, `domContainer`).
   - Comentarios y textos de UI: ESPAÑOL (ej. `// Asignar eventos de clic`).

## 🚫 Anti-patrones (PROHIBIDOS)
- REJECT if: Generas strings de HTML o usas template literals para UI dentro de este archivo. Eso es responsabilidad exclusiva del `.view.js`.
- REJECT if: Manipulas estilos CSS directamente (`element.style.color...`). Debes alternar clases CSS (`classList.add()`).
- REJECT if: Haces peticiones `fetch` o llamadas directas a APIs aquí. Toda la red pertenece al `.service.js`.

## 💾 Paso Final: Persistencia de Artefactos (Engram)
Como subagente, debes documentar tu trabajo para futuras sesiones o compactaciones de contexto.
- REQUIRE: Al terminar tu tarea, usa OBLIGATORIAMENTE la herramienta `mem_save` para guardar decisiones arquitectónicas importantes tomadas en este controlador (estado local, enrutamiento, o manejo de eventos complejos).
- PREFER: Utiliza siempre un `topic_key` estructurado en `mem_save` (ej. `architecture/controller-[nombre]`) para que las memorias futuras sobre este archivo se actualicen (upsert) en lugar de duplicarse.