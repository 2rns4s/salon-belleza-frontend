# Documentación Académica - Salón de Belleza

## 1. Arquitectura y Flujo de Datos
El proyecto implementa una arquitectura basada en Clean Architecture y principios Hexagonales, aislando la lógica de negocio de la interfaz de usuario. Utilizamos un enrutador SPA basado en Hash routing para la navegación fluida.

Diagrama de Hash Routing:
```
[Navegador URL #/ruta] ──(hashchange)──> [router.js] ──(match)──> [Controller]
```

Flujo MVC:
```
[Controller] ──> [View] ──(Render)──> [DOM]
     │
  (Llama)
     ↓
 [Service] ──> [HttpClient] ──> [Backend API (Java/Spring)]
```

## 2. Elementos de Pantalla por Funcionalidad
- **Auth:** Pantallas de login/signup, manejo de credenciales de usuario.
- **MFA:** Formulario de verificación (verification form), manejo de token pre-auth (pre-auth token).
- **Citas:** Visualización de calendario (calendar), intervalos de tiempo (slots), creación y listado de citas (creation, list).
- **Dashboard:** Tarjetas de métricas del salón (salon metrics cards), listado de servicios principales (top services list).

## 3. Paleta de Colores y Estilos
El sistema utiliza la metodología BEM CSS para garantizar clases escalables, reusables y mantenibles.
Los estilos globales utilizan CSS variables definidas en `src/shared/components/layout/global.css`:
- `primary`: Color principal para botones y acciones.
- `secondary`: Color secundario.
- `warning`, `error`: Estados de validación.
- `backgrounds`, `fonts`: Estilos estructurales y de tipografía.

## 4. Análisis de Resultados Esperados
- **Happy Paths:** El usuario experimenta un flujo exitoso con feedback de UI inmediato (ej: éxito al agendar cita).
- **Casos de Error (Edge cases):** Manejo de validaciones fallidas (validation failures), errores HTTP (HTTP errors) y caídas de la API (API down), notificados visualmente mediante alertas (UI toast alerts).

## 5. Usabilidad y Calidad de Software
El desarrollo sigue estrictos estándares de accesibilidad WCAG:
- Verificación de contrastes de color.
- Uso de `aria-labels` para lectores de pantalla.
- Uso de HTML semántico (semantic HTML).
- Navegación interactiva por teclado (keyboard nav).
En seguridad, se previenen vulnerabilidades como XSS mediante el escape estricto de HTML en las vistas (HTML escaping in views).

## 6. Estándares y Tecnologías de Calidad
El entorno está preparado para pruebas automatizadas con el runner de Vitest y la simulación del entorno de navegador con jsdom.
La capa de pruebas de integración se aloja en `tests/integration/`, permitiendo verificar flujos completos sin dependencias externas inestables.
