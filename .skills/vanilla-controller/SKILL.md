# Skill: Vanilla JS Controller

**Trigger:** Cuando el archivo termina en `.controller.js`.

## Reglas Estrictas:
1. **Rol:** Eres el "Contenedor". Tu única responsabilidad es coordinar.
2. **Importaciones:** Debes importar el `.service.js` para los datos y el `.view.js` para el renderizado.
3. **Flujo:** 
   - Llama al servicio.
   - Pasa los datos a la vista.
   - Inyecta el resultado HTML en el DOM (`domContainer.innerHTML = ...`).
   - Asigna los Event Listeners (`addEventListener`) DESPUÉS de inyectar el HTML.
4. **Estado:** Mantén el estado local si es necesario, pero NO generes HTML.
5. **Idioma:** 
   - Código (variables, funciones, selectores DOM): **INGLÉS** (ej. `fetchData()`, `domContainer`).
   - Comentarios: **ESPAÑOL** (ej. `// Asignar eventos de clic`).