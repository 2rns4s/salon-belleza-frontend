# Protocolo RNF - Modulo Citas

## Objetivo
Validar cumplimiento de requisitos no funcionales del modulo de citas:
- `agendaLoadMs <= 1.5s`
- `availabilityRefreshMs <= 0.5s`
- Usabilidad responsive en tablet (`768-1023` y `>=1024`)
- Objetivos tactiles minimos `44x44`
- Encabezado/filtros sticky para operacion continua

## Entorno objetivo
- Sistema operativo: Linux
- Runtime: Node.js + Vitest + JSDOM
- Frontend: Vanilla JS (feature `src/features/citas/`)
- API: contratos de `MANUAL_FRONTEND.md` (citas/clientes/disponibilidad)

## Dataset de prueba
- Disponibilidad: `fecha=2026-03-11`, `idServicio=5`, `idEmpleado=2`
- Citas: al menos 1 cita existente para validar actualizacion/eliminacion
- Cliente: al menos 1 cliente existente + escenario sin resultados para quick-add

## Procedimiento de medicion
1. Carga inicial de agenda (`agendaLoadMs`)
- Abrir `/citas`.
- Aplicar filtros validos (fecha + servicio + empleado).
- Leer metrica mostrada en UI: `Carga agenda`.
- Repetir 5 veces y registrar promedio/maximo.

2. Refresco de disponibilidad (`availabilityRefreshMs`)
- Cambiar filtros de fecha/servicio/empleado.
- Leer metrica mostrada en UI: `Refresco disponibilidad`.
- Repetir 5 veces y registrar promedio/maximo.

3. Responsive tablet y desktop
- Verificar layout en `768-1023` (apilado, sticky, formularios legibles).
- Verificar layout en `>=1024` (dos columnas: disponibilidad + reserva).
- Confirmar sin desbordes criticos en vertical/horizontal.

4. Objetivos tactiles
- Inspeccionar `input`, `select`, `button`, `slot` y botones de cliente.
- Confirmar `min-height >= 44px` por CSS.

## Criterio de aprobacion
- PASS rendimiento: `agendaLoadMs <= 1500ms` y `availabilityRefreshMs <= 500ms`.
- PASS responsive: layout usable en breakpoints tablet/desktop sin zoom forzado.
- PASS tactil: controles interactivos con area minima >= 44px.

## Evidencia esperada
- Tabla con mediciones (iteracion, valor, umbral, resultado).
- Captura/resumen de validacion responsive por breakpoint.
- Referencias de pruebas automatizadas de integracion ejecutadas.
