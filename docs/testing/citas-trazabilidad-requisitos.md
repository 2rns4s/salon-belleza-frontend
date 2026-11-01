# Trazabilidad de requisitos — Módulo Citas

Índice que enlaza cada requisito del SRS con el código que lo soporta y la
prueba que lo verifica. Estándar: `docs/desarrollo/trazabilidad-requisitos.md`.

## Convenciones de cobertura

- `AUTO`: verificado por prueba automatizada (Vitest).
- `MANUAL`: verificado por protocolo/medición documentada.
- `PARCIAL`: alcance reducido o decisión vigente distinta al SRS.
- `BACKEND`: garantía del backend; el frontend consume/refleja el resultado.

## Requisitos funcionales

| RF | HU | Narrativa (descripción de la HU) | Código | Prueba | Cobertura |
|---|---|---|---|---|---|
| RF-001 Motor de control de concurrencia | HU-01 | Como Recepcionista, quiero que el sistema valide la disponibilidad del empleado Y del recurso al mismo tiempo, para agendar sin doble reserva. | `citas.service.js` (`getAvailability`) | `citas-availability-refresh.spec.js` (slots válidos) | AUTO (consumo) / BACKEND (validación) |
| RF-004 Filtro de disponibilidad por servicio | HU-04 | Como Recepcionista, quiero que al seleccionar un servicio el sistema filtre la disponibilidad asociada. | `citas.service.js` (query `idServicio`/`idEmpleado`) | `citas-availability-refresh.spec.js` (reconsulta con filtros distintos) | AUTO |
| RF-005 Validación de empleado | HU-05 | Como Recepcionista, quiero que el sistema impida reservar si el empleado ya está ocupado. | backend; reflejado en mensajes 409 | `citas-crud-and-conflicts.spec.js` (409) | BACKEND / AUTO (reflejo UI) |
| RF-006 Validación de recurso físico | HU-06 | Como Recepcionista, quiero que el sistema impida reservar si el recurso ya está ocupado. | backend; reflejado en mensajes 409 | `citas-crud-and-conflicts.spec.js` (409) | BACKEND / AUTO (reflejo UI) |
| RF-007 Mostrar solo horarios válidos | HU-07 | Como Recepcionista, quiero ver solo los horarios que pasaron todas las validaciones. | `citas.service.js` (`getAvailability`), `citas.view.js` (grid) | `citas-availability-refresh.spec.js` (render de slots) | AUTO |
| RF-008 Registrar cita | HU-08 | Como Recepcionista, quiero registrar la cita y que se quite de la disponibilidad futura. | `citas.service.js` (`createAppointment`, `getAppointments`) | `citas-crud-and-conflicts.spec.js` (refresh post-CRUD) | AUTO |
| RF-009 Gestión de clientes en el flujo | HU-09 | Como Recepcionista, quiero buscar/crear la ficha del cliente para asociar la cita. | `citas.service.js` (`searchClients`, `createClient`) | `citas-crud-and-conflicts.spec.js` (404 → quick-add) | AUTO |
| RF-010 Confirmación de cita (notificación) | HU-10 | Como Cliente, quiero recibir notificación tras el registro de la cita. | backend (Twilio/servicio externo) | — | BACKEND (fuera del alcance frontend) |

## Requisitos no funcionales

| RNF | Atributo | Dónde se refleja | Prueba / Evidencia | Cobertura |
|---|---|---|---|---|
| RNF-001 | Rendimiento: agenda <=1.5s | `citas.constants.js` (`agendaLoadMs=1500`) | `docs/testing/citas-rnf-results.md` | MANUAL (instrumentado) |
| RNF-005 | Rendimiento: disponibilidad <=0.5s | `citas.constants.js` (`availabilityRefreshMs=500`) | `docs/testing/citas-rnf-results.md` | MANUAL (instrumentado) |
| RNF-008 | Integridad: anti-overbooking | manejo de 409 en controller | `citas-crud-and-conflicts.spec.js` (409 bloquea + reconcilia) | AUTO (reflejo) / BACKEND (garantía) |
| RNF-015 | Manejo de errores accionables | `citas.constants.js` (`CITAS_HTTP_MESSAGES`, `CITAS_UI_MESSAGES`) | `citas-crud-and-conflicts.spec.js` (400 con mensajes) | AUTO |

## Notas de honestidad

- Las validaciones de concurrencia (RF-001, RF-005, RF-006, RNF-008) son
  garantía del **backend**. El frontend consume la disponibilidad ya validada y
  refleja/reconciliar los conflictos (409). No se atribuye al frontend una
  garantía de integridad que no le corresponde.
- RF-010 (notificación al cliente) depende de un servicio externo del backend;
  está fuera del alcance de este repositorio frontend.
- Los RNF de rendimiento se instrumentan pero su resultado depende del entorno
  de ejecución; se documentan como medición, no como certificación.
