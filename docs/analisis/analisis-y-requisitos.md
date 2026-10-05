# Análisis y requisitos del Sistema de Gestión de Citas

Este es el documento autoritativo de la fase de análisis. Define el problema, el instrumento académico de levantamiento, el alcance, los requisitos, las historias de usuario y su trazabilidad. La implementación técnica se mantiene separada en el [índice de documentación](../README.md).

## 1. Control y metadatos académicos

| Campo | Valor |
|---|---|
| Proyecto | Sistema de Gestión de Citas para Salón de Belleza |
| Autor / aprendiz | Daniel Steban Diaz Osorio |
| Programa | Análisis y Desarrollo de Software — ABP |
| Ficha | 3336049 |
| Instructor responsable | Diego Fernando Bolaños Chamorro |
| Regional | Centro Agropecuario Regional Cauca |
| Año | 2025 |
| Estado | Documento vivo reconstruido a partir del análisis académico y del frontend vigente |

### Propósito y audiencia

El documento permite que análisis, desarrollo, calidad e instructor verifiquen qué problema se pretende resolver y cómo se conecta con requisitos e implementación. Los estados de evidencia no sustituyen una aceptación de negocio: indican únicamente qué puede comprobarse en este repositorio frontend.

### Estados utilizados

| Estado | Significado |
|---|---|
| `implementado` | Existe evidencia directa en código o configuración vigente. |
| `parcial` | Existe una parte comprobable, pero la afirmación completa depende de otros componentes o validación adicional. |
| `no verificado` | No hay evidencia suficiente en este repositorio. |
| `objetivo futuro` | Capacidad o nivel de servicio previsto, todavía no demostrado. |

## 2. Levantamiento de información

### 2.1 Instrumento y condición de aplicación

Se diseñó una **entrevista semiestructurada dirigida al rol Propietario del salón**. Su aplicación y los hallazgos siguientes son **simulados para fines académicos**: no existe evidencia de que se haya entrevistado a un stakeholder real. La simulación permite estructurar necesidades iniciales, pero requiere validación posterior con una persona responsable del negocio antes de convertirlas en compromisos contractuales.

### 2.2 Guion y hallazgos simulados

| N.º | Pregunta semiestructurada | Hallazgo de la aplicación simulada |
|---:|---|---|
| 1 | ¿Cuáles son los procesos diarios más importantes del salón? | La programación de citas y la ejecución de servicios sostienen la operación. La rentabilidad depende de reducir tiempos ociosos y evitar reservas dobles. |
| 2 | ¿Por qué canales se solicitan actualmente las citas? | Las solicitudes llegan por teléfono de recepción, WhatsApp y atención presencial. No existe un sistema de citas en línea y recepción centraliza el proceso. |
| 3 | ¿Cómo se atiende hoy una reserva telefónica? | El proceso es manual y caótico: recepción consulta una hoja de Excel para la disponibilidad del estilista y otra tabla para la ocupación de sillas y lavacabezas. Cada cita exige varias comprobaciones manuales. |
| 4 | ¿Qué requiere un servicio complejo como Corte y Tinte? | Deben coincidir un colorista calificado, una silla y un lavacabezas. Omitir cualquiera de esas comprobaciones produce un error de programación. |
| 5 | ¿Cuáles son las principales frustraciones del proceso? | Se presentan errores y reservas dobles, lentitud y poca visibilidad. Durante la espera el cliente puede finalizar la llamada, lo que causa pérdida de tiempo e ingresos. |

### 2.3 Conclusión del análisis

El problema central es la **gestión manual de concurrencia**. La agenda obliga a verificar por separado el calendario del empleado y la ocupación de recursos físicos, aunque ambos deben estar libres simultáneamente. Esto genera riesgo de overbooking, pérdida de ingresos, clientes insatisfechos, reservas lentas y baja visibilidad operativa.

La solución requerida es un **Integrated Concurrency Control Engine** (`RF-001`, obligatorio) que valide automática y simultáneamente la disponibilidad del empleado calificado y de todos los recursos físicos necesarios. El frontend consulta y presenta las franjas válidas; la autoridad transaccional que evita condiciones de carrera debe residir en el backend.

## 3. Objetivos de negocio

| ID | Objetivo | Indicador esperado | Estado de medición |
|---|---|---|---|
| OBJ-001 | Reducir errores de agenda y overbooking. | Ausencia de citas confirmadas con empleado o recursos solapados. | No medido en producción. |
| OBJ-002 | Reducir el tiempo de registro de una cita. | Proceso al menos 50 % más eficiente que la línea base manual. | Línea base no levantada. |
| OBJ-003 | Centralizar la visibilidad de empleados, recursos y citas. | Recepción consulta una única vista integrada. | Parcial en el frontend. |
| OBJ-004 | Proteger las funciones administrativas. | Perfiles administrativos con MFA y control de rol. | Parcial; MFA y algunas guardas existen. |
| OBJ-005 | Mejorar la confirmación al cliente. | Notificación enviada tras una reserva exitosa. | Integración no verificada. |

## 4. Alcance del producto

### 4.1 Alcance inicial

- Despliegue previsto en una intranet local.
- Uso responsive por recepción en equipos de escritorio y tabletas.
- Agenda de citas con validación de concurrencia.
- Gestión de horarios, especialidades y servicios de empleados.
- Gestión de recursos físicos finitos y su asociación a servicios.
- Gestión de servicios, clientes, usuarios, autenticación y MFA.
- Confirmaciones o notificaciones como integración dependiente del backend/proveedor.
- Dashboard y reportes básicos únicamente en la medida en que exista implementación; actualmente `/dashboard` es un placeholder.

### 4.2 Exclusiones iniciales

- Facturación e inventario.
- Portal público de autogestión para clientes.
- Pasarelas de pago.
- Despliegue obligatorio en nube pública.
- Reportes financieros avanzados.

### 4.3 Evolución posible

Autogestión de clientes, pagos, despliegue público o cloud y soporte multi-sede son posibilidades futuras; requieren análisis, seguridad y autorización de alcance propios.

### 4.4 Privacidad y contexto legal

Los datos de contacto de clientes deben tratarse conforme a la Ley 1581 de 2012 de Colombia y a las políticas aplicables de autorización, finalidad, acceso, corrección y supresión. Este repositorio frontend no demuestra cifrado en reposo, retención, backups ni controles operativos del backend.

### 4.5 Actores

| Actor | Responsabilidad principal |
|---|---|
| Propietario (`OWNER`) | Configura empleados, servicios, recursos y usuarios; supervisa la operación. |
| Recepcionista (`RECEPTIONIST`) | Consulta disponibilidad, gestiona clientes y registra citas. |
| Cliente | Recibe el servicio y, mediante una integración futura o externa, la confirmación de su cita. No usa un portal público en el alcance inicial. |
| Backend / proveedor externo | Ejecuta reglas autoritativas de concurrencia, persistencia y entrega de notificaciones. No es un actor humano ni está verificado por este frontend. |

## 5. Requisitos funcionales

| ID | Requisito | Prioridad | Evidencia actual |
|---|---|---|---|
| RF-001 | El sistema debe validar en una sola operación la disponibilidad concurrente de empleado calificado y recursos físicos requeridos antes de confirmar una cita. | Obligatoria | `parcial`: el frontend consume disponibilidad y maneja conflictos; la atomicidad corresponde al backend. |
| RF-002 | El Propietario debe crear y actualizar empleados, especialidades y franjas laborales. | Alta | `implementado` en el módulo `empleados`, sujeto al contrato API. |
| RF-003 | El Propietario debe configurar recursos físicos y cantidades finitas. | Alta | `implementado` en `recursos`; el control transaccional de capacidad no se verifica aquí. |
| RF-004 | La disponibilidad debe filtrarse por servicio y excluir empleados no calificados. | Alta | `parcial`: la UI consume servicio, empleado y endpoint de disponibilidad. |
| RF-005 | El sistema debe rechazar intervalos que se solapen para el mismo empleado. | Alta | `parcial`: existe manejo frontend; la garantía es del backend. |
| RF-006 | El sistema debe rechazar intervalos que excedan la capacidad de un recurso físico. | Alta | `parcial`: la interfaz depende de la disponibilidad y de respuestas `409`. |
| RF-007 | La interfaz debe omitir o bloquear franjas inválidas. | Alta | `implementado` para la selección presentada por el módulo de citas. |
| RF-008 | La Recepcionista debe registrar una cita válida y ver la agenda actualizada. | Alta | `implementado` en el consumidor frontend; persistencia depende de la API. |
| RF-009 | La Recepcionista debe buscar, crear y asociar clientes. | Alta | `implementado` en `clientes` y en el flujo de citas. |
| RF-010 | El sistema debe emitir una confirmación de cita con servicio, fecha y hora. | Media | `no verificado`: requiere backend y proveedor de notificaciones. |
| RF-011 | El sistema debe autenticar usuarios mediante JWT y completar verificación TOTP cuando se requiera MFA. | Alta | `implementado` en el flujo frontend; emisión y validación criptográfica pertenecen al backend. |
| RF-012 | El Propietario debe administrar usuarios y roles `OWNER`/`RECEPTIONIST`. | Alta | `implementado`; las guardas de sesión son parciales y no uniformes. |

## 6. Historias de usuario

### HU-001 — Integrated Concurrency Control Engine

| Campo | Valor |
|---|---|
| Actor | Recepcionista |
| Prioridad / puntos | Alta / 5 |
| Historia | Como Recepcionista, quiero ver únicamente horarios donde coincidan un empleado calificado y todos los recursos físicos requeridos, para registrar citas sin overbooking. |
| Razón | Sustituye las comprobaciones manuales separadas por una decisión integrada. |
| Dependencias | HU-002, HU-003 |
| RF vinculados | RF-001, RF-004, RF-005, RF-006, RF-007 |

1. **Coincidencia completa** — **Dado** un servicio con empleado y recursos disponibles, **Cuando** se consulta una fecha válida, **Entonces** la franja se presenta como seleccionable.
2. **Empleado no disponible** — **Dado** que los recursos están libres pero el empleado está ocupado, **Cuando** se calcula disponibilidad, **Entonces** la franja se omite o bloquea.
3. **Recurso no disponible** — **Dado** que el empleado está libre pero falta un recurso requerido, **Cuando** se calcula disponibilidad, **Entonces** la franja se omite o bloquea.

### HU-002 — Gestión de empleados

| Campo | Valor |
|---|---|
| Actor | Propietario |
| Prioridad / puntos | Alta / 4 |
| Historia | Como Propietario, quiero crear y actualizar empleados, especialidades y horarios de trabajo, para que la disponibilidad use información operativa vigente. |
| Razón | La aptitud y jornada del empleado condicionan cada cita. |
| Dependencias | Catálogo de servicios y autenticación con rol `OWNER` |
| RF vinculados | RF-002, RF-004 |

1. **Configuración válida** — **Dado** un Propietario autenticado, **Cuando** registra un empleado con especialidad y franja laboral válidas, **Entonces** el empleado queda disponible para los servicios asociados dentro de su horario.
2. **Especialidad incompatible** — **Dado** un empleado sin calificación para un servicio, **Cuando** se consulta la disponibilidad de ese servicio, **Entonces** el empleado no aparece como opción.

### HU-003 — Gestión de recursos físicos

| Campo | Valor |
|---|---|
| Actor | Propietario |
| Prioridad / puntos | Alta / 4 |
| Historia | Como Propietario, quiero configurar los recursos físicos y su cantidad finita, para impedir reservas que excedan la capacidad del salón. |
| Razón | Sillas, lavacabezas y equipos pueden ser compartidos, pero no sobreasignados. |
| Dependencias | Autenticación con rol `OWNER`; catálogo de servicios |
| RF vinculados | RF-003, RF-006 |

1. **Capacidad disponible** — **Dado** un recurso con cantidad total tres y dos unidades ocupadas, **Cuando** se solicita otra cita solapada que requiere una unidad, **Entonces** la franja puede ofrecerse.
2. **Capacidad agotada** — **Dado** un recurso con cantidad total dos y dos unidades ocupadas, **Cuando** se intenta una tercera reserva simultánea, **Entonces** la franja no se ofrece o la operación se rechaza.

### HU-004 — Filtrar disponibilidad por servicio

| Campo | Valor |
|---|---|
| Actor | Recepcionista |
| Prioridad / puntos | Alta / 4 |
| Historia | Como Recepcionista, quiero filtrar empleados y horarios por el servicio seleccionado, para asignar únicamente personal calificado. |
| Razón | Evita ofrecer profesionales que no ejecutan el servicio. |
| Dependencias | HU-002; catálogo de servicios |
| RF vinculados | RF-004, RF-007 |

1. **Servicio compatible** — **Dado** que una manicurista presta Manicure, **Cuando** se selecciona ese servicio, **Entonces** puede aparecer entre los empleados disponibles.
2. **Servicio incompatible** — **Dado** que un colorista no presta Manicure, **Cuando** se selecciona Manicure, **Entonces** ese colorista no aparece como opción.

### HU-005 — Validación de solapamiento de empleado

| Campo | Valor |
|---|---|
| Actor | Recepcionista |
| Prioridad / puntos | Media / 3 |
| Historia | Como Recepcionista, quiero que se detecten citas solapadas de un empleado, para evitar asignarlo a dos clientes al mismo tiempo. |
| Razón | Un empleado solo puede ejecutar una atención simultánea. |
| Dependencias | HU-002, HU-008 |
| RF vinculados | RF-001, RF-005 |

1. **Solapamiento** — **Dado** un empleado con cita de 10:00 a 11:00, **Cuando** se solicita otra cita a las 10:30, **Entonces** la nueva franja se bloquea o rechaza.
2. **Intervalo posterior** — **Dado** la misma cita de 10:00 a 11:00, **Cuando** se solicita una cita que inicia a las 11:00 y cumple las demás reglas, **Entonces** puede continuar.

### HU-006 — Validación de solapamiento de recurso físico

| Campo | Valor |
|---|---|
| Actor | Recepcionista |
| Prioridad / puntos | Alta / 3 |
| Historia | Como Recepcionista, quiero validar la ocupación de recursos físicos, para no reservar simultáneamente un recurso cuya capacidad está agotada. |
| Razón | La disponibilidad de otro empleado no compensa la falta del equipo requerido. |
| Dependencias | HU-003, HU-008 |
| RF vinculados | RF-001, RF-006 |

1. **Lavacabezas ocupado** — **Dado** un único lavacabezas ocupado, **Cuando** otro empleado intenta registrar un servicio solapado que también lo requiere, **Entonces** la franja se bloquea o rechaza.
2. **Recurso liberado** — **Dado** que la ocupación termina antes de la nueva cita, **Cuando** se consulta el intervalo posterior, **Entonces** el recurso puede contarse como disponible.

### HU-007 — Mostrar solo franjas válidas

| Campo | Valor |
|---|---|
| Actor | Recepcionista |
| Prioridad / puntos | Alta / 5 |
| Historia | Como Recepcionista, quiero seleccionar únicamente franjas válidas, para evitar decisiones basadas en horarios imposibles. |
| Razón | Reduce errores y carga cognitiva durante llamadas. |
| Dependencias | HU-001, HU-004 |
| RF vinculados | RF-007 |

1. **Empleado no disponible** — **Dado** un empleado fuera de su jornada, **Cuando** se carga la disponibilidad, **Entonces** la franja no puede seleccionarse.
2. **Recurso no disponible** — **Dado** un recurso requerido sin capacidad, **Cuando** se carga la disponibilidad, **Entonces** la franja no puede seleccionarse.

### HU-008 — Registrar cita

| Campo | Valor |
|---|---|
| Actor | Recepcionista |
| Prioridad / puntos | Media / 4 |
| Historia | Como Recepcionista, quiero registrar una cita a partir de una selección válida y un cliente, para reservar el empleado y los recursos necesarios. |
| Razón | Materializa la reserva después de validar datos y disponibilidad. |
| Dependencias | HU-001, HU-009 |
| RF vinculados | RF-001, RF-008 |

1. **Registro exitoso** — **Dado** un cliente y una franja válida seleccionados, **Cuando** se confirma la reserva, **Entonces** se crea la cita y se informa el éxito.
2. **Agenda actualizada** — **Dado** una cita creada, **Cuando** se actualiza la agenda, **Entonces** el empleado y los recursos usados aparecen ocupados durante su intervalo.
3. **Conflicto concurrente** — **Dado** que otra operación tomó la franja antes de confirmar, **Cuando** la API responde `409`, **Entonces** la interfaz informa el conflicto y solicita actualizar la agenda.

### HU-009 — Gestión de clientes

| Campo | Valor |
|---|---|
| Actor | Recepcionista |
| Prioridad / puntos | Alta / 3 |
| Historia | Como Recepcionista, quiero buscar un cliente por teléfono y crearlo si no existe, para asociarlo a la cita sin duplicar registros. |
| Razón | La identificación del cliente es requisito de la reserva. |
| Dependencias | API de clientes |
| RF vinculados | RF-009 |

1. **Cliente existente** — **Dado** un teléfono registrado, **Cuando** se realiza la búsqueda, **Entonces** el cliente encontrado puede asociarse a la cita.
2. **Cliente inexistente** — **Dado** un teléfono sin coincidencias, **Cuando** se registran datos válidos, **Entonces** se crea y asocia el nuevo cliente.
3. **Duplicado** — **Dado** documento o teléfono ya registrado, **Cuando** se intenta crear otro cliente, **Entonces** la interfaz muestra el conflicto informado por la API.

### HU-010 — Confirmación de cita

| Campo | Valor |
|---|---|
| Actor | Cliente |
| Prioridad / puntos | Media / 5 |
| Historia | Como Cliente, quiero recibir una confirmación con el servicio, la fecha y la hora, para conservar los datos de mi cita. |
| Razón | Reduce incertidumbre y facilita la asistencia. |
| Dependencias | HU-008; backend y proveedor externo de notificaciones |
| RF vinculados | RF-010 |

1. **Entrega solicitada** — **Dado** una reserva exitosa, **Cuando** el backend confirma la creación, **Entonces** debe solicitarse el envío de una notificación con servicio, fecha y hora.
2. **Fallo de integración** — **Dado** una cita creada y un proveedor no disponible, **Cuando** falla el envío, **Entonces** la cita no debe presentarse como fallida y el sistema debe registrar o comunicar el estado según una política por definir.

> La entrega de notificaciones no está implementada ni verificada en este frontend. Su canal, proveedor, reintentos y observabilidad son decisiones de integración pendientes.

## 7. Requisitos no funcionales

| ID | Categoría | Enunciado medible | Método de verificación | Evidencia / estado actual |
|---|---|---|---|---|
| RNF-001 | Rendimiento | La vista integrada de agenda debe estar disponible en ≤ 1,5 s bajo un escenario y entorno definidos. | Prueba de rendimiento end-to-end con datos, red y dispositivo controlados. | `parcial`: existe umbral y reporte histórico con JSDOM/mocks; no es medición productiva. |
| RNF-002 | Eficiencia | El proceso de reserva debe requerir 50 % menos tiempo que la línea base manual. | Estudio cronometrado antes/después con tareas equivalentes. | `no verificado`: no existe línea base observada. |
| RNF-003 | Seguridad | Los perfiles administrativos deben requerir 2FA/MFA. | Prueba de autenticación por rol y revisión de política backend. | `parcial`: hay login y flujos MFA; la obligatoriedad por perfil no se demuestra. |
| RNF-004 | Usabilidad | Una Recepcionista nueva capacitada debe completar una reserva en menos de 5 interacciones principales. | Test de usabilidad con definición previa de interacción. | `no verificado`. |
| RNF-005 | Rendimiento | El motor de disponibilidad debe responder en ≤ 0,5 s bajo carga definida. | Medición API end-to-end y percentiles acordados. | `parcial`: umbral y prueba local histórica con mocks; backend productivo no medido. |
| RNF-006 | Disponibilidad | El servicio debe alcanzar 99,5 % de disponibilidad durante 09:00–19:00. | Monitoreo de uptime y cálculo mensual acordado. | `objetivo futuro`: depende de infraestructura y operación. |
| RNF-007 | Compatibilidad | La interfaz debe adaptarse a escritorio, tableta y móvil sin impedir tareas críticas. | Matriz de viewport, navegador y pruebas manuales/automatizadas. | `parcial`: existe CSS responsive; no hay matriz completa ejecutada. |
| RNF-008 | Integridad | Ninguna confirmación debe producir overbooking de empleado o recurso. | Pruebas concurrentes y restricciones transaccionales en backend. | `parcial`: el frontend consume disponibilidad; la integridad autoritativa no se verifica. |
| RNF-009 | Privacidad | Los datos de contacto del cliente deben estar cifrados en reposo. | Revisión de almacenamiento, llaves y configuración backend/infraestructura. | `no verificado`: responsabilidad backend/infraestructura. |
| RNF-010 | Auditoría | Altas, cambios y cancelaciones de citas deben registrar timestamp e identidad del actor. | Consulta de auditoría y pruebas de trazabilidad backend. | `no verificado`. |
| RNF-011 | Mantenibilidad | El código debe aplicar convenciones documentadas y superar los checks definidos por el repositorio. | Revisión de estructura, convenciones y ejecución de `npm run verify`. | `parcial`: convenciones y checks existen; no se ejecutaron en esta reconstrucción documental. |
| RNF-012 | Sostenibilidad | La tecnología debe mantenerse soportada, con objetivo de ciclo de vida de cinco años y revisiones periódicas. | Revisión anual de runtimes, navegadores y dependencias. | `objetivo futuro`: no existe garantía de cinco años. |
| RNF-013 | Compatibilidad | La aplicación debe soportar las versiones vigentes más recientes de Chrome y Firefox. | Matriz de pruebas en versiones objetivo. | `no verificado`: Vitest/jsdom no sustituye navegadores reales. |
| RNF-014 | Continuidad | Debe existir backup diario y RTO menor de 8 h. | Evidencia de jobs, restauración y simulacro de recuperación. | `no verificado`: responsabilidad operativa/backend. |
| RNF-015 | Usabilidad | Las validaciones y errores visibles para recepción deben indicar causa y siguiente acción. | Pruebas de UI para estados 400/401/403/404/409/5xx y revisión de contenido. | `parcial`: existen mensajes por módulo y normalización de errores; falta auditoría integral. |

## 8. Matriz de trazabilidad

| Hallazgo de levantamiento | Objetivo | RF | HU | Implementación o módulo relevante | Pruebas / evidencia | Brecha |
|---|---|---|---|---|---|---|
| H1: evitar reservas dobles y tiempos ociosos | OBJ-001, OBJ-003 | RF-001, RF-005, RF-006 | HU-001, HU-005, HU-006 | `src/features/citas/`; `GET /api/v1/disponibilidad` | `tests/integration/`; `docs/testing/citas-spec-traceability.md` | Atomicidad y concurrencia backend no verificadas. |
| H2: recepción centraliza teléfono, WhatsApp y atención presencial | OBJ-002, OBJ-003 | RF-008, RF-009 | HU-008, HU-009 | `src/features/citas/`, `src/features/clientes/` | Smoke e integration tests; reportes históricos en `docs/testing/` | No hay integración directa con WhatsApp ni portal público. |
| H3: doble consulta manual de Excel y recursos | OBJ-002, OBJ-003 | RF-001, RF-007 | HU-001, HU-007 | Agenda y consulta de disponibilidad en `src/features/citas/` | `docs/testing/citas-rnf-results.md` con metodología local | Falta estudio contra línea base manual real. |
| H4: Corte y Tinte exige colorista, silla y lavacabezas simultáneos | OBJ-001 | RF-002, RF-003, RF-004, RF-006 | HU-002, HU-003, HU-004, HU-006 | `src/features/empleados/`, `servicios/`, `recursos/`, `citas/` | Specs de integración por feature | No se prueba aquí la asignación transaccional conjunta del backend. |
| H5: errores, lentitud y falta de visibilidad causan pérdida de clientes | OBJ-001, OBJ-002, OBJ-003, OBJ-005 | RF-007, RF-008, RF-010 | HU-007, HU-008, HU-010 | Mensajes de citas; `/dashboard` placeholder | Reportes de citas fechados en `docs/testing/` | No hay métricas productivas, dashboard real ni proveedor de notificaciones. |
| Necesidad de proteger administración | OBJ-004 | RF-011, RF-012 | Soporte transversal de HU-002 y HU-003 | `src/features/auth/`, `mfa/`, `usuarios/`, `shared/state/` | `tests/integration/mfa-active-guard.spec.js` | Guardas de sesión no uniformes; política MFA por rol no verificada. |

## 9. Riesgos, decisiones pendientes y referencias

- Validar este levantamiento simulado con un stakeholder real y registrar fecha, participantes y aprobación.
- Confirmar el contrato backend de `POST /api/v1/usuarios/me/mfa/enable`: la documentación histórica declara `204`, mientras el frontend puede recibir `{ token }` para rotar el JWT.
- Definir despliegue, HTTPS y estrategia de sesión antes de decidir una migración desde `localStorage` a cookies `httpOnly`.
- Especificar proveedor, canal, reintentos y observabilidad de notificaciones.
- Definir escenarios, datos, hardware y percentiles para los RNF de rendimiento y disponibilidad.
- Ejecutar auditorías independientes de accesibilidad, seguridad, privacidad y continuidad.

Referencias técnicas: [arquitectura frontend](../arquitectura/arquitectura-frontend.md), [integración API](../api/integracion-api.md), [autenticación y MFA](../seguridad/autenticacion-y-mfa.md) y [estrategia de pruebas](../calidad/estrategia-de-pruebas.md).