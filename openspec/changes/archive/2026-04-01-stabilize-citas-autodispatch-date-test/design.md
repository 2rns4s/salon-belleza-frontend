# Design: Stabilize citas autodispatch date test

## Context
El test CITAS-AUTODISPATCH-02 usaba una fecha literal que, al coincidir con la fecha actual, podía no generar cambio efectivo en el estado y romper el assert de reconsulta.

## Decision
Calcular la fecha objetivo desde el valor inicial de `selectedDate` y desplazarla un día.

## Why
- Elimina dependencia del calendario real.
- Mantiene validación del comportamiento esperado (disparo de nueva consulta ante cambio real).
- Reduce flakes y evita falsos negativos.

## File Changes
| File | Change |
|------|--------|
| `tests/integration/citas-ux-hotfix.spec.js` | Fecha de prueba dinámica en CITAS-AUTODISPATCH-02 |
