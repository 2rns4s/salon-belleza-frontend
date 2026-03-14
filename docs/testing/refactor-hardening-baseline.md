# Baseline de Regresion - Hardening Refactor (Phase 1)

Fecha: 2026-03-14

## Objetivo
Documentar el baseline de regresion previo al refactor interno y la validacion de salida de la Phase 1 del cambio `hardening-dry-mvc-error-bem`, bajo la regla de Cero Regresiones.

## Alcance de la Phase 1
- Congelar comportamiento observable antes de migraciones internas.
- Crear fixture compartido de ErrorResponse.
- Reforzar contratos e integracion de errores en modulos criticos.
- Ejecutar gate completo de salida.

## Baseline Inicial (antes de cambios de Phase 1)
Comandos ejecutados:
- `npm test`
- `npm run test:smoke`
- `npm run test:integration`

Resultado consolidado:
- `npm test` -> 124/124
- `npm run test:smoke` -> 6/6
- `npm run test:integration` -> 118/118

## Evidencia Intermedia (suite dirigida de specs impactadas)
Comando ejecutado:
- `npx vitest run` (7 specs modificados de contratos e integracion de errores)

Resultado:
- 34/34 en verde

## Salida de Phase 1 (gate)
Comandos ejecutados:
- `npm run test:smoke`
- `npm run test:integration`
- `npm test`

Resultado consolidado:
- `npm run test:smoke` -> 6/6
- `npm run test:integration` -> 127/127
- `npm test` -> 133/133

## Delta de cobertura funcional protegida
- Total de tests: 124 -> 133 (+9)
- Enfoque del refuerzo:
  - Contratos de servicios/recursos/clientes frente a ErrorResponse.
  - Flujos de errores en citas (400/401/409 y detalles por campo).
  - Flujo de auth con 401 sin redireccion indebida.

## Conclusion
Phase 1 finalizo en verde, sin cambios en codigo productivo y sin regresiones funcionales observables.