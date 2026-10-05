# Sistema de Gestión de Citas para Salón de Belleza

Frontend web para centralizar la agenda de un salón de belleza y apoyar a recepción en la gestión de citas, clientes, empleados, servicios y recursos físicos. El objetivo principal del producto es reducir errores de concurrencia —incluido el overbooking— mediante disponibilidad calculada por la API y presentada por la interfaz.

> **Estado:** frontend en desarrollo. La autenticación, MFA, los módulos de gestión y el flujo de citas tienen implementación verificable; `/dashboard` aún muestra un placeholder. La garantía final de concurrencia, persistencia, notificaciones y operación depende del backend y de la infraestructura.

## Capacidades principales

- Inicio de sesión con JWT y segundo paso MFA cuando la API lo solicita.
- Aprovisionamiento MFA mediante QR y código TOTP.
- Gestión de clientes, empleados, servicios, recursos y usuarios.
- Consulta de disponibilidad, creación y actualización de citas.
- Navegación SPA mediante hash routing.
- Roles `OWNER` y `RECEPTIONIST`, con guardas de rol en módulos administrativos; la protección de sesión no es uniforme en todas las rutas.

## Stack

| Área | Tecnología o enfoque |
|---|---|
| Interfaz | HTML5, CSS3 y JavaScript ESM sin framework SPA |
| Arquitectura | Módulos por funcionalidad con límites Controller/View/Service de estilo MVC |
| Navegación | Router propio basado en `window.location.hash` y `hashchange` |
| API | `fetch` mediante un cliente HTTP compartido |
| Estilos | CSS variables y convención BEM |
| Pruebas | Vitest 2, jsdom 24 y coverage V8 |

## Inicio rápido

### Requisitos

- Node.js y npm compatibles con las dependencias del proyecto.
- Backend accesible en `http://localhost:8080`; esta URL está configurada directamente en el cliente HTTP.

```bash
npm install
npm run build
npm test
```

`npm run build` ejecuta una comprobación de sintaxis sobre JavaScript; no genera un bundle. Los scripts `npm run dev` y `npm run preview` son placeholders y no inician servidores. Para usar la interfaz se necesita servir los archivos estáticos por un mecanismo externo y disponer de la API.

## Estructura del proyecto

```text
src/app/                 Ensamblaje y bootstrap
src/features/            Módulos de negocio por funcionalidad
src/shared/              Router, estado, HTTP, mappers, UI y estilos comunes
tests/                   Smoke tests, integration tests, fixtures y setup
docs/                    Documentación funcional y técnica mantenida
scripts/check-syntax.mjs Comprobación usada por npm run build
entregas/                Evidencias académicas conservadas fuera del producto fuente
```

La descripción detallada está en [Estructura del proyecto](docs/desarrollo/estructura-del-proyecto.md).

## Documentación

- [Análisis y requisitos](docs/analisis/analisis-y-requisitos.md): instrumento de levantamiento simulado, alcance, requisitos, historias de usuario y trazabilidad.
- [Índice maestro de documentación](docs/README.md): arquitectura, desarrollo, API, seguridad, calidad y estilos.

## Verificación

Los comandos definidos en `package.json` son:

```bash
npm run build             # node scripts/check-syntax.mjs
npm test                  # vitest run
npm run test:smoke        # vitest run tests/smoke
npm run test:integration  # vitest run tests/integration
npm run verify            # build + smoke + integration + test
```

Consulte [Estrategia de pruebas](docs/calidad/estrategia-de-pruebas.md) antes de interpretar cobertura, rendimiento o reportes históricos.

## Límites del alcance

El frontend no demuestra por sí solo cifrado en reposo, backups, disponibilidad productiva, auditoría transaccional, entrega de notificaciones ni la prevención autoritativa de overbooking. Tampoco incluye facturación, inventario, pasarelas de pago ni un portal público de autogestión. Estas responsabilidades y decisiones se documentan como requisitos, integraciones o trabajo futuro, no como capacidades verificadas.