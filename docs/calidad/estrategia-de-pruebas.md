# Estrategia de pruebas

El proyecto usa Vitest con jsdom para smoke tests e integration tests. Esta configuración valida JavaScript y comportamiento DOM aislado, pero no demuestra por sí sola interoperabilidad con el backend, navegadores reales, rendimiento productivo ni cumplimiento de SLA.

## Configuración vigente

| Aspecto | Configuración |
|---|---|
| Runner | Vitest `^2.1.8` |
| Entorno | jsdom `^24.1.3` |
| Patrón | `tests/**/*.spec.js` |
| Setup global | `tests/setup/test-setup.js` |
| Mocks | `clearMocks: true`, `restoreMocks: true` |
| Coverage | Proveedor V8 |
| Thresholds configurados | lines 70 %, functions 70 %, branches 60 %, statements 70 % |

Los thresholds son una política configurada; no prueban que la cobertura actual los alcance sin ejecutar una corrida con coverage.

## Organización

| Ruta | Propósito |
|---|---|
| `tests/smoke/` | Carga básica y recorridos críticos de baja profundidad. |
| `tests/integration/` | Colaboración entre routes, controllers, views, services, estado y mappers con dobles de red. |
| `tests/fixtures/` | Datos de prueba reutilizables. |
| `tests/setup/test-setup.js` | Limpia DOM, hash y `localStorage` entre pruebas. |

No existe una carpeta `tests/unit/` independiente. Algunos reportes históricos usan el término “unit tests”, pero la estructura vigente se clasifica por smoke e integration.

## Comandos verificados

| Comando | Script exacto | Uso |
|---|---|---|
| `npm run build` | `node scripts/check-syntax.mjs` | Comprueba sintaxis de `.js` en `src` y `tests`; no crea bundle. |
| `npm test` | `vitest run` | Ejecuta todas las specs incluidas. |
| `npm run test:smoke` | `vitest run tests/smoke` | Ejecuta smoke tests. |
| `npm run test:integration` | `vitest run tests/integration` | Ejecuta integration tests. |
| `npm run verify` | `npm run build && npm run test:smoke && npm run test:integration && npm test` | Cadena completa definida por el repositorio. |
| `npm run test:watch` | `vitest` | Modo interactivo de desarrollo. |
| `npm run test:usuarios` | `vitest run tests/integration/usuarios-service-contract.spec.js tests/integration/usuarios-crud-and-scope.spec.js` | Verificación enfocada del módulo de usuarios. |

## Estrategia por cambio

1. Identificar el requisito o contrato afectado.
2. Añadir o actualizar una spec determinista en la suite apropiada.
3. Ejecutar la suite enfocada durante el desarrollo.
4. Ejecutar `npm run build` para comprobar sintaxis.
5. Ejecutar `npm run verify` antes de una entrega cuando el entorno lo permita.
6. Registrar resultados observados con comando, fecha y entorno; no reutilizar conteos antiguos como evidencia actual.

## Matriz de verificación

| Riesgo o comportamiento | Evidencia recomendada |
|---|---|
| Router y carga inicial | Smoke test con hash y contenedor DOM. |
| Controller/View/Service | Integration test con eventos, DOM y `fetch` simulado. |
| Mappers y errores | Casos con variantes de payload, estados y field errors. |
| Sesión y claims MFA | Specs de rehidratación, expiración, roles y `mfa_enabled`. |
| Concurrencia de citas | Integration test frontend más pruebas transaccionales del backend. |
| Compatibilidad Chrome/Firefox | Pruebas en navegadores reales; jsdom no es suficiente. |
| Responsive | Inspección y pruebas por viewport; jsdom no calcula layout visual completo. |
| Accesibilidad | Herramientas automáticas y pruebas manuales de teclado/lector de pantalla. |
| Rendimiento | Medición end-to-end con API, datos, red y dispositivo definidos. |
| Seguridad | Revisión específica de frontend y pruebas backend/infraestructura. |

## Reportes históricos conservados

| Reporte | Qué aporta | Límite |
|---|---|---|
| [citas-rnf.md](../testing/citas-rnf.md) | Criterios de RNF para citas. | Especificación, no resultado actual. |
| [citas-rnf-results.md](../testing/citas-rnf-results.md) | Mediciones locales y revisión responsive. | Usa JSDOM, mocks e inspección CSS; no equivale a producción. |
| [citas-spec-traceability.md](../testing/citas-spec-traceability.md) | Relación de casos de citas. | Debe contrastarse con código actual. |
| [citas-test-report.md](../testing/citas-test-report.md) | Corrida fechada de 16 tests de citas. | Resultado histórico del 2026-03-11. |
| [refactor-hardening-baseline.md](../testing/refactor-hardening-baseline.md) | Baseline 124→133 tests. | Conteos de una fase anterior. |
| [refactor-hardening-report.md](../testing/refactor-hardening-report.md) | Hardening y 135 tests reportados. | No demuestra el conteo vigente. |

Los conteos anteriores no deben sumarse ni presentarse como suite actual. Una nueva afirmación necesita una ejecución nueva.

## Límites de verificación

- No se infiere cobertura alcanzada a partir de thresholds.
- Un mock de disponibilidad no demuestra el tiempo de respuesta del motor backend.
- Una prueba DOM no demuestra contraste, foco visible real ni compatibilidad completa del navegador.
- Los contratos de API simulados deben complementarse con contract tests o un entorno integrado.
- Cifrado, backups, auditoría, disponibilidad y entrega de notificaciones quedan fuera de la evidencia de este repositorio.

Trazabilidad de requisitos: [Análisis y requisitos](../analisis/analisis-y-requisitos.md). Prácticas de interfaz: [Accesibilidad y usabilidad](accesibilidad-y-usabilidad.md).