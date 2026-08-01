# Documentación Académica - Salón de Belleza

## 1. Arquitectura y Flujo de Datos

El proyecto implementa una arquitectura basada en Clean Architecture y principios Hexagonales, separando explícitamente las capas: presentation/view, controller/routing, application/service, e infrastructure/http client. Utilizamos un enrutador SPA basado en Hash routing para la navegación.

**Diagrama de Hash Routing:**
```text
[Navegador URL #/ruta] ──(hashchange)──> [router.js] ──(match)──> [Controller]
```

**Diagrama de Flujo MVC:**
```text
[Controller] ──> [View] ──(Render)──> [DOM]
     │
  (Llama)
     ↓
  [Service] ──> [HttpClient] ──> [Backend API (Java/Spring)]
```

El flujo del cliente al servidor sigue el camino `[Service] ──> [HttpClient] ──> [Backend API]`.

**Convenciones de Nomenclatura:**
| Capa | Convención | Ejemplo |
|---|---|---|
| Controllers | Sufijo `Controller` | `LoginController` |
| Views | Sufijo `View` | `LoginView` |
| Services | Sufijo `Service` | `AuthService` |
| Routes | minúsculas, guiones | `/login-page` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |
| Mappers | Sufijo `Mapper` | `UserMapper` |


## 2. Elementos de Pantalla por Funcionalidad

| Funcionalidad | Elementos de Pantalla |
|---|---|
| Auth | Formulario de Login, Formulario de Registro, Enlaces de recuperación. |
| MFA | Input de código, Botón de verificación, Temporizador de reenvío. |
| Citas | Calendario de fechas, Selector de servicios, Grilla de disponibilidad, Modal de confirmación. |
| Dashboard | Tarjetas de KPI, Gráficos de tendencias, Listado de próximos servicios. |


## 3. Paleta de Colores y Estilos

El sistema utiliza la metodología BEM CSS (Block__Element--Modifier) para asegurar estilos escalables. Todos los estilos estructurales están construidos con base en CSS variables.

**Mapeo de Variables CSS:**

| Variable | Valor Hexadecimal |
|---|---|
| `--color-fondo-principal` | `--color-fondo-principal: #f8f3f4` |
| `--color-texto-principal` | `--color-texto-principal: #2c1a1e` |
| `--color-superficie` | `--color-superficie: #ffffff` |
| `--color-header-vinotinto-claro` | `--color-header-vinotinto-claro: #8a3f52` |
| `--color-texto-inverso` | `--color-texto-inverso: #ffffff` |
| `--color-vinotinto-hover` | `--color-vinotinto-hover: #72333e` |
| `--color-vinotinto-soft` | `--color-vinotinto-soft: #f3e8eb` |
| `--color-vinotinto-border` | `--color-vinotinto-border: #eadde0` |
| `--color-vinotinto-contrast` | `--color-vinotinto-contrast: #5c3344` |
| `--color-vinotinto-muted` | `--color-vinotinto-muted: #6b4a52` |
| `--color-vinotinto-subtle` | `--color-vinotinto-subtle: #9e7a85` |
| `--color-vinotinto-gradient-start` | `--color-vinotinto-gradient-start: #fff7f8` |
| `--color-vinotinto-gradient-end` | `--color-vinotinto-gradient-end: #fffcf7` |
| `--color-surface-alt` | `--color-surface-alt: #fff5f7` |
| `--color-surface-hover` | `--color-surface-hover: #fffaf8` |
| `--color-texto-secundario` | `--color-texto-secundario: #4a4a4a` |
| `--color-input-border` | `--color-input-border: #d1b8be` |
| `--color-feedback-error-bg` | `--color-feedback-error-bg: #fdecea` |
| `--color-feedback-error-text` | `--color-feedback-error-text: #b71c1c` |
| `--color-feedback-error-border` | `--color-feedback-error-border: #f5c6cb` |
| `--color-feedback-success-bg` | `--color-feedback-success-bg: #e8f5e9` |
| `--color-feedback-success-text` | `--color-feedback-success-text: #1b5e20` |
| `--color-feedback-success-border` | `--color-feedback-success-border: #c8e6c9` |
| `--color-role-owner` | `--color-role-owner: #7b1fa2` |
| `--color-role-receptionist` | `--color-role-receptionist: #1976d2` |
| `--color-status-active` | `--color-status-active: #388e3c` |
| `--color-status-inactive` | `--color-status-inactive: #9e9e9e` |
| `--color-action-danger` | `--color-action-danger: #c62828` |
| `--color-action-danger-hover` | `--color-action-danger-hover: #a31515` |
| `--color-warning-text` | `--color-warning-text: #e65100` |


## 4. Análisis de Resultados Esperados

El módulo de citas (Citas) cuenta con validaciones estrictas en el cliente:
- **Solapamiento (Schedule overlaps):** Se bloquea la selección si el intervalo entra en conflicto con una cita existente.
- **Restricciones de empleados (Employee validation):** Verifica que el empleado seleccionado preste el servicio en el horario indicado.
- **Límites de recursos (Resource limits):** Comprueba que los equipos o espacios físicos necesarios estén disponibles.

**Resultados:**
- **Happy Paths (Éxitos):** Flujos completados sin errores que culminan en confirmaciones visuales.
- **Error/Edge cases:** Las fallas de validación (validation failures), errores de red (HTTP errors), caídas del servidor (API down) se manejan de manera elegante usando notificaciones visuales (UI toast alerts).


## 5. Usabilidad y Calidad de Software

En cuanto a usabilidad, el frontend adhiere a los estándares de accesibilidad WCAG:
- Se asegura un alto contraste.
- Se utilizan etiquetas aria-labels en elementos interactivos sin texto visible.
- Se implementa HTML semántico (semantic HTML).
- Soporta la navegación por teclado (keyboard nav).

El código aplica una estricta Separation of concerns (separación de responsabilidades). Para mitigar vulnerabilidades, implementamos prevención de XSS aplicando un riguroso HTML escaping in views (escape HTML en vistas).


## 6. Estándares y Tecnologías de Calidad

Nuestro proceso de aseguramiento de la calidad está guiado por pruebas de software robustas:
- Se utiliza el runner Vitest para la ejecución rápida y eficiente de pruebas.
- Se emplea el entorno de simulación jsdom para recrear un entorno DOM confiable sin un navegador completo.
- Nuestra capa de integración (Integration testing layer) se encuentra en la ruta `tests/integration/`, enfocada en validar los flujos completos.

