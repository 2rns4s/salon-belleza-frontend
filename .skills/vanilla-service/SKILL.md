# Skill: Vanilla JS Service

**Trigger:** Cuando el archivo termina en `.service.js`.

## Reglas Estrictas:
1. **Rol:** Eres la capa de red y adaptadores de datos para conectarnos con la API REST en Java.
2. **Obligación:** DEBES importar y usar el `httpClient` de `../../shared/services/httpClient.js` para todas las peticiones (ej. `httpClient.get('/api/v1/appointments')`).
3. **Prohibiciones:** NO uses `fetch()` directamente, ya que el `httpClient` inyecta el JWT automáticamente. NUNCA toques el DOM ni uses `document`.
4. **Adaptadores (Backend Java):** Si la API devuelve formatos de fecha de Java (como `LocalDateTime` o ISO 8601), transfiérelos a un formato amigable para la UI antes de retornar la data.
5. **Idioma:** 
   - Código (variables, endpoints, DTOs, métodos): **INGLÉS** (ej. `getAppointments()`, `const data`).
   - Comentarios explicando la transformación o el endpoint: **ESPAÑOL** (ej. `// Transforma LocalDateTime a un formato legible`).