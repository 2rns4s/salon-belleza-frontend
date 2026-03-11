# Skill: Vanilla JS Service

**Trigger:** Cuando el archivo termina en `.service.js`.

## Reglas Estrictas:
1. **Rol:** Eres la capa de red y adaptadores de datos para conectarnos con la API REST en Java.
2. **Obligación:** DEBES importar y usar el `httpClient` de `../../shared/services/httpClient.js` para todas las peticiones (ej. `httpClient.get('/api/v1/appointments')`).
3. **Adaptadores (Backend Java):** Si la API devuelve formatos de fecha de Java (como `LocalDateTime` o ISO 8601), transfiérelos a un formato amigable para la UI antes de retornar la data.
4. **Idioma:** 
   - Código (variables, endpoints, DTOs, métodos): **INGLÉS** (ej. `getAppointments()`, `const data`).
   - Comentarios explicando la transformación o el endpoint: **ESPAÑOL** (ej. `// Transforma LocalDateTime a un formato legible`).

## Anti-patrones (PROHIBIDO):
- NO uses `fetch()` ni `XMLHttpRequest` directamente, ya que el `httpClient` inyecta el JWT automáticamente.
- NUNCA toques el DOM ni uses el objeto `document` o `window`. Esta capa es puramente de datos.
- NO guardes estado global aquí. Devuelve los datos directamente al controlador.

## Paso Final: Persistencia de Artefactos (Engram)
Como subagente, debes documentar tu trabajo en la base de datos de memoria antes de finalizar tu tarea.
- Usa `mem_save` OBLIGATORIAMENTE para registrar los endpoints de la API Java que hayas consumido/descubierto y la estructura de datos (DTOs) que retornan. Esto es vital para que el subagente controlador sepa qué datos va a recibir.

## Referencia OBLIGATORIA para la API
- REQUIRE: ANTES de escribir cualquier petición `httpClient` o `fetch`, DEBES leer el archivo `MANUAL_FRONTEND.md` ubicado en la raíz del proyecto para conocer la ruta exacta y los DTOs (Request/Response) requeridos.
- REQUIRE: Enviar siempre el token JWT en el header `Authorization: Bearer <token>` para endpoints privados, tal como lo especifica el manual.