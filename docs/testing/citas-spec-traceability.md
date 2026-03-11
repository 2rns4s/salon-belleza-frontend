# Matriz de Trazabilidad Spec - Modulo Citas

## Convenciones
- `AUTO`: cubierto por prueba automatizada.
- `MANUAL`: cubierto por protocolo/documentacion.
- `PARCIAL`: cobertura existente con alcance reducido o decision vigente distinta al spec original.

## Trazabilidad
| Dominio / Escenario del spec | Cobertura | Evidencia |
|---|---|---|
| Vista agenda y carga de slots disponibles | AUTO | `tests/integration/citas-availability-refresh.spec.js` (`renderiza los slots disponibles`) |
| Revalidacion al cambiar filtros (fecha/servicio/empleado) | AUTO | `tests/integration/citas-availability-refresh.spec.js` (`reconsulta la API con filtros diferentes`) |
| Cache corta e invalidacion por refresh | AUTO | `tests/integration/citas-availability-refresh.spec.js` (`usa cache con TTL`, `Recargar invalida cache`) |
| Cancelacion de request obsoleta (AbortController) | AUTO | `tests/integration/citas-availability-refresh.spec.js` (`no deja panel en error si request es cancelada`) |
| Seleccion visual de slot para reserva | AUTO | `tests/integration/citas-availability-refresh.spec.js` (`click en slot -> --selected`) |
| Busqueda cliente sin salir del flujo | AUTO | `tests/integration/citas-crud-and-conflicts.spec.js` (flujos de busqueda + seleccion) |
| Busqueda sin coincidencias habilita quick-add | AUTO | `tests/integration/citas-crud-and-conflicts.spec.js` (`quick-add invalido ...`) |
| Quick-add invalido (400) mantiene contexto y formulario | AUTO | `tests/integration/citas-crud-and-conflicts.spec.js` (`quick-add invalido ...`) |
| Crear cita y refrescar agenda | AUTO | `tests/integration/citas-crud-and-conflicts.spec.js` (`refresh post-CRUD ...`) |
| Actualizar estado de cita y refrescar agenda | AUTO | `tests/integration/citas-crud-and-conflicts.spec.js` (`refresh post-CRUD ...`) |
| Eliminar cita y refrescar agenda | AUTO | `tests/integration/citas-crud-and-conflicts.spec.js` (`refresh post-CRUD ...`) |
| Manejo 409 (bloqueo + mensaje + reconciliacion) | AUTO | `tests/integration/citas-crud-and-conflicts.spec.js` (`conflicto 409 ...`) |
| Manejo 400 con mensajes accionables en espanol | AUTO | `tests/integration/citas-crud-and-conflicts.spec.js` + mensajes de UI en `citas.view.js` |
| Manejo 401 global (limpieza de sesion + redireccion auth) | AUTO | `tests/integration/http-401-global.spec.js` |
| Landing post-login y post-MFA | AUTO / PARCIAL | `tests/integration/auth-landing.spec.js` (landing actual `/dashboard` para ambos flujos) |
| Responsive tablet/desktop + touch targets >=44 | MANUAL | `docs/testing/citas-rnf.md` + `docs/testing/citas-rnf-results.md` |
| Umbrales RNF `agendaLoadMs <=1.5s` y `availabilityRefreshMs <=0.5s` | MANUAL (instrumentado) | `docs/testing/citas-rnf-results.md` |

## Notas de alineacion
- El flujo de landing por rol se mantiene segun implementacion vigente de auth (`/dashboard`), por eso se marca `PARCIAL` respecto al scenario de recepcionista hacia `/citas` definido en spec historico.
- Los escenarios criticos de Fase 6 (quick-add 400, conflicto 409, refresh post-CRUD, 401 global) quedan cubiertos con pruebas de integracion automatizadas.
