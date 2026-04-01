# Proposal: Stabilize citas autodispatch date test

## Intent
Evitar fragilidad temporal en el escenario CITAS-AUTODISPATCH-02 cuando la fecha fija del test coincide con la fecha inicial del estado.

## Scope
### In Scope
- Ajustar el test de integración para usar una fecha dinámica distinta a la inicial.
- Mantener el contrato funcional del autodispatch sin cambios de negocio.
- Validar el resultado con verify completo.

### Out of Scope
- Cambios de comportamiento en producción de citas.
- Refactor de la arquitectura de tests.

## Capabilities
### New Capabilities
- None

### Modified Capabilities
- citas: estabilidad temporal de validación en autodispatch de disponibilidad.

## Approach
Usar una fecha derivada del estado inicial (+1 día) para garantizar transición real de filtros y evitar falsos negativos por calendario.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `tests/integration/citas-ux-hotfix.spec.js` | Modified | Se elimina dependencia de fecha fija en CITAS-AUTODISPATCH-02 |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Regresión en asserts del flujo | Low | Re-ejecutar test puntual y verify completo |

## Rollback Plan
Revertir el ajuste del test a su versión previa y re-evaluar estrategia de control de tiempo.

## Dependencies
- Vitest integration suite.

## Success Criteria
- [x] CITAS-AUTODISPATCH-02 pasa de forma estable.
- [x] `npm run verify` termina en verde.
