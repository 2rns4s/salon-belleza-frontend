# Skill: Vanilla JS Controller

**Trigger:** Cuando el archivo termina en `.controller.js`.

## Reglas Estrictas:
1. **Rol:** Eres el "Contenedor". Tu única responsabilidad es coordinar.
2. **Importaciones:** Debes importar el `.service.js` para los datos y el `.view.js` para el renderizado.
3. **Flujo OBLIGATORIO:** 
   - Llama al servicio.
   - Pasa los datos a la vista.
   - Inyecta el resultado HTML en el DOM (`domContainer.innerHTML = ...`).
   - Asigna los Event Listeners (`addEventListener`) DESPUÉS de inyectar el HTML.
4. **Estado:** Mantén el estado local si es necesario.
5. **Idioma:** 
   - Código (variables, funciones, selectores DOM): **INGLÉS** (ej. `fetchData()`, `domContainer`).
   - Comentarios: **ESPAÑOL** (ej. `// Asignar eventos de clic`).

## Anti-patrones (PROHIBIDO):
- NO generes strings de HTML dentro de este archivo. Eso es responsabilidad exclusiva del `.view.js`.
- NO manipules estilos CSS directamente (`element.style...`). Usa clases CSS.
- NO hagas peticiones `fetch` o llamadas a APIs aquí. Eso pertenece al `.service.js`.

## Paso Final: Persistencia de Artefactos (Engram)
Como subagente, debes documentar tu trabajo. Al terminar de escribir el controlador:
- Usa `mem_save` para guardar cualquier decisión arquitectónica importante que hayas tomado sobre el estado o el enrutamiento de los eventos.