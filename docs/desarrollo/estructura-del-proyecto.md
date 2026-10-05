# Estructura del proyecto

El código separa el ensamblaje, las funcionalidades de negocio y la infraestructura compartida. La unidad principal de mantenimiento es `src/features/<feature>/`, no una capa horizontal global.

## Mapa principal

```text
.
├── index.html
├── package.json
├── vitest.config.js
├── scripts/
│   └── check-syntax.mjs
├── src/
│   ├── app/
│   │   └── bootstrap.js
│   ├── features/
│   │   ├── auth/
│   │   ├── citas/
│   │   ├── clientes/
│   │   ├── empleados/
│   │   ├── mfa/
│   │   ├── recursos/
│   │   ├── servicios/
│   │   ├── user-settings/
│   │   └── usuarios/
│   └── shared/
│       ├── components/
│       ├── mappers/
│       ├── router/
│       ├── services/
│       ├── state/
│       ├── storage/
│       ├── styles/
│       └── ui/
├── tests/
│   ├── fixtures/
│   ├── integration/
│   ├── setup/
│   └── smoke/
├── docs/
└── entregas/
```

## Responsabilidades

| Ruta | Responsabilidad | No debe asumir |
|---|---|---|
| `src/app/bootstrap.js` | Rehidratar sesión, montar layout, registrar rutas y configurar errores no autorizados. | Lógica específica de formularios o contratos de una feature. |
| `src/features/` | Implementar flujos de interfaz agrupados por capacidad de negocio. | Infraestructura duplicada que ya existe en `shared`. |
| `src/shared/components/` | Componentes transversales, incluido el layout. | Reglas específicas de una entidad. |
| `src/shared/router/` | Registrar y resolver rutas por hash. | Autorizar operaciones de backend. |
| `src/shared/services/` | Cliente HTTP y comportamiento transversal de transporte. | Decidir requisitos funcionales. |
| `src/shared/state/` | Estado de sesión y contexto autenticado. | Persistencia segura del backend. |
| `src/shared/storage/` | Acceso encapsulado a almacenamiento del navegador. | Verificar firma JWT. |
| `src/shared/mappers/` | Normalizar primitivas, fechas y errores HTTP compartidos. | Renderizar DOM. |
| `src/shared/ui/` | Utilidades de interfaz, como escape HTML. | Garantizar por sí solas seguridad XSS global. |
| `src/shared/styles/` | Tokens y estilos globales. | Reemplazar estilos específicos de features. |
| `tests/smoke/` | Validar carga y recorridos básicos. | Demostrar contratos productivos completos. |
| `tests/integration/` | Verificar colaboración entre módulos con entorno jsdom y dobles. | Sustituir pruebas end-to-end con backend/navegador real. |
| `tests/fixtures/` | Datos reutilizables para pruebas. | Datos productivos. |
| `tests/setup/` | Preparar y limpiar DOM, hash y `localStorage`. | Configuración de despliegue. |
| `docs/` | Documentación mantenida y reportes históricos. | Artefactos locales de herramientas de IA. |
| `entregas/` | Evidencias académicas que deben conservarse. | Código fuente de la aplicación. |

## Anatomía de una feature

Los módulos no tienen exactamente los mismos archivos, pero siguen este vocabulario:

| Archivo | Función habitual |
|---|---|
| `*.routes.js` | Publica la ruta y aplica guardas locales cuando existen. |
| `*.controller.js` | Orquesta eventos, estado, Service y View. |
| `*.view.js` | Construye o actualiza DOM y lee estado visual mediante helpers. |
| `*.service.js` | Construye solicitudes y consume `httpClient`. |
| `*.constants.js` | Endpoints, estados, límites de validación y mensajes. |
| `*.mappers.js` | Traduce formularios y respuestas a modelos usados por la feature. |
| `*.css` | Estilos BEM o patrones visuales propios. |

Ejemplo de dependencia:

```text
citas.routes.js
  -> citas.controller.js
       -> citas.view.js
       -> citas.service.js
            -> citas.constants.js
            -> shared/services/httpClient.js
```

## Módulos funcionales

| Feature | Alcance observado |
|---|---|
| `auth` | Login, verificación MFA de acceso y registro de credenciales para empleado preexistente. |
| `citas` | Agenda, filtros, disponibilidad, clientes dentro del flujo, creación y cambio de estado. |
| `clientes` | Listado y creación de clientes. |
| `empleados` | CRUD y asociación con catálogo de servicios. |
| `mfa` | Setup QR y confirmación TOTP. |
| `recursos` | CRUD de recursos y cantidades. |
| `servicios` | CRUD de servicios y asociación de recursos. |
| `user-settings` | Menú de cuenta y acceso al flujo MFA; otros endpoints están previstos, no implementados. |
| `usuarios` | CRUD/desactivación de usuarios y asociación con empleados. |

## Dependencias externas y ejecución

- No existe bundler: los módulos son JavaScript ESM.
- `npm run build` llama `scripts/check-syntax.mjs` y comprueba sintaxis; no genera archivos de distribución.
- La aplicación necesita archivos estáticos servidos y una API en la base configurada.
- Vitest usa jsdom para las suites bajo `tests/**/*.spec.js`.

## Dónde documentar cada cambio

| Cambio | Documento de referencia |
|---|---|
| Alcance, requisito o historia | [Análisis y requisitos](../analisis/analisis-y-requisitos.md) |
| Límite o flujo estructural | [Arquitectura](../arquitectura/arquitectura-frontend.md) |
| Convención de código | [Convenciones](convenciones.md) |
| Endpoint o DTO consumido | [Integración API](../api/integracion-api.md) |
| Sesión o MFA | [Autenticación y MFA](../seguridad/autenticacion-y-mfa.md) |
| Pruebas | [Estrategia de pruebas](../calidad/estrategia-de-pruebas.md) |
| Tokens o BEM | [Sistema de diseño](../estilos/sistema-de-diseno.md) |