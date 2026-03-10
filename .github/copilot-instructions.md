# Orquestador Principal de Copilot

Estás trabajando en el frontend "Sistema de Gestión Salón de Belleza" (Vanilla JS, HTML, CSS) que consume una API REST en Java. Usamos Clean Architecture.

## 1. Delegación de Tareas (Skills)
ANTES de escribir código, DEBES:
- Identificar qué tipo de archivo pide el usuario.
- Leer el archivo de reglas (`SKILL.md`) correspondiente:
   - Lógica/coordinación (`.controller.js`): LEE `.skills/vanilla-controller/SKILL.md`
   - Renderizado HTML (`.view.js`): LEE `.skills/vanilla-view/SKILL.md`
   - Conexión a API (`.service.js`): LEE `.skills/vanilla-service/SKILL.md`

## 2. Idioma (NUEVA REGLA)
- Nombres de variables, funciones, archivos y clases CSS BEM: **Inglés** (ej. `getAppointments`, `AppointmentController`, `btn--primary`).
- Interfaz de Usuario (HTML) y Comentarios de código: **Español** (ej. `<button>Guardar</button>`, `// Obtiene las citas del backend`).

## 3. Sistema de Memoria OBLIGATORIO (Engram MCP)
Tienes acceso a la memoria persistente del proyecto EXCLUSIVAMENTE vía herramientas MCP del servidor `engram`.
1. PROHIBIDO crear archivos físicos de memoria (ej. .md sueltos).
2. Usa `mem_save` para guardar decisiones importantes o endpoints descubiertos.
3. Usa `mem_search` proactivamente antes de empezar una tarea.
