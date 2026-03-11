# Skill: Vanilla JS Service

**Trigger:** Cuando el archivo termina en `.service.js`.

## 🧠 Paso 0: Recuperación de Contexto y Contratos (Engram + Manual)
- REQUIRE: ANTES de empezar a codificar, utiliza `mem_search` para buscar si existen decisiones previas o configuraciones de red guardadas en memoria para este módulo.
- REQUIRE **CRÍTICO:** DEBES leer obligatoriamente el archivo `MANUAL_FRONTEND.md` ubicado en la raíz del proyecto para conocer la ruta exacta del endpoint, los DTOs (Request/Response) y el formato de error que espera el backend Java. No adivines ni inventes endpoints.

## 📜 Reglas Estrictas (Capa de Red y Datos)
- REQUIRE **Rol:** Eres exclusivamente la capa de red y adaptadores de datos. Tu trabajo es aislar al controlador de la complejidad de la API REST.
- REQUIRE **Cliente HTTP:** DEBES importar y usar estrictamente el envoltorio `httpClient` de `../../shared/services/httpClient.js` para todas las peticiones (este ya se encarga de inyectar el JWT en el header `Authorization`).
- REQUIRE **Adaptadores (Mappers):** Si la API Java devuelve formatos estrictos (como `LocalDateTime` o ISO 8601), DEBES transformarlos a un formato amigable para la UI antes de retornar la promesa.
- REQUIRE **Idioma:** 
   - Código lógico interno (variables, métodos): INGLÉS (ej. `getAppointments()`, `const data`).
   - Propiedades de los DTOs de red: Exactamente como lo exija el `MANUAL_FRONTEND.md` (aunque estén en español).
   - Comentarios explicativos: ESPAÑOL (ej. `// Transforma LocalDateTime a un formato legible`).

## 🚫 Anti-patrones (PROHIBIDOS)
- REJECT if: Usas `fetch()`, `XMLHttpRequest` o dependencias externas directamente. Todo debe pasar a través de `httpClient`.
- REJECT if: Tocas el DOM de alguna manera, accedes a `document`, `window` o mezclas lógica visual. Esta capa no sabe que existe una pantalla.
- REJECT if: Guardas estado global o de negocio aquí. Este archivo solo debe tener métodos asíncronos que hacen peticiones y devuelven la data al controlador.

## 💾 Paso Final: Persistencia de Artefactos (Engram)
Como subagente, debes documentar tu trabajo para que el subagente encargado del Controlador (`.controller.js`) sepa exactamente qué métodos creaste y qué datos (DTOs adaptados) le vas a devolver.
- REQUIRE: Al terminar, usa OBLIGATORIAMENTE la herramienta `mem_save` para registrar los endpoints consumidos, las adaptaciones realizadas y los métodos públicos expuestos por este servicio.
- PREFER: Utiliza siempre un `topic_key` estructurado (ej. `api-service/[nombre-entidad]`) para que las memorias futuras de red actualicen (upsert) este registro en lugar de duplicarlo.