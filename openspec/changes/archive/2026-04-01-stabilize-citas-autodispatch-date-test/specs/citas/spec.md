# Spec Delta: citas

## ADDED Requirements
None.

## MODIFIED Requirements

### Requirement: Citas autodispatch is deterministic in integration tests
El escenario CITAS-AUTODISPATCH-02 debe validar el redispatch ante un cambio real de filtros sin depender de una fecha fija del calendario.

#### Scenario: Date transition triggers refresh deterministically
- **GIVEN** un estado inicial con `selectedDate`
- **WHEN** el test aplica una fecha distinta derivada del estado inicial (+1 día)
- **THEN** el flujo dispara una nueva consulta y el assert es estable entre ejecuciones

## REMOVED Requirements
None.
