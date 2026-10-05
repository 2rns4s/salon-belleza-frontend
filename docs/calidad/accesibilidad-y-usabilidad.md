# Accesibilidad y usabilidad

El frontend contiene prácticas puntuales de accesibilidad y feedback, pero no existe una auditoría que permita afirmar cumplimiento WCAG 2.1 AA. Este documento separa la implementación comprobada de los objetivos de calidad.

## Estado resumido

| Área | Estado | Evidencia o límite |
|---|---|---|
| HTML semántico | Parcial | Existen estructuras y regiones semánticas en distintas views; no se auditó todo el DOM. |
| Nombres accesibles | Parcial | Se usan `aria-label` y texto visible en controles; falta inventario integral. |
| Anuncios de estado | Parcial | Existen regiones `aria-live` en módulos. |
| Diálogos | Parcial | Se observan `aria-modal` y roles; faltan pruebas sistemáticas de foco y escape. |
| Foco visible | Parcial | Hay estilos `:focus`/`:focus-visible` en CSS de features. |
| Objetivos táctiles | Parcial | Citas define controles de 44 px en elementos relevantes. |
| Navegación por teclado | No verificado | La presencia de HTML y foco no demuestra recorridos completos. |
| Contraste | No verificado | No existe auditoría de ratios en todos los estados. |
| Lectores de pantalla | No verificado | No se registraron pruebas con tecnología asistiva. |
| WCAG 2.1 AA | Objetivo futuro | Requiere auditoría por criterio y evidencia reproducible. |

## Prácticas observadas

- Uso de `role`, `aria-label`, `aria-live` y `aria-modal` en varias features.
- HTML estructural y labels visibles en formularios.
- Mensajes diferenciados para carga, éxito, vacío, validación y error.
- Estilos de foco en módulos, incluidos usuarios.
- Tamaño táctil mínimo de 44 px en controles del módulo de citas.
- Escape de contenido dinámico mediante helper compartido y helpers locales.
- Layout y CSS con reglas responsive para adaptar tareas a distintos anchos.

Estas evidencias son parciales: no garantizan cobertura uniforme de todos los controles, estados o rutas.

## Objetivos de accesibilidad

| ID | Objetivo | Verificación necesaria |
|---|---|---|
| A11Y-001 | Todas las tareas críticas deben completarse con teclado. | Recorrido manual sin mouse: login, MFA, búsqueda, creación de cliente y cita. |
| A11Y-002 | El foco debe ser visible y seguir un orden lógico. | Inspección por ruta, modal y actualización dinámica. |
| A11Y-003 | Cada control debe tener nombre, rol y estado accesibles. | Auditoría del árbol de accesibilidad. |
| A11Y-004 | Errores y resultados dinámicos deben anunciarse sin depender solo del color. | Pruebas con `aria-live` y lector de pantalla. |
| A11Y-005 | Texto e indicadores deben cumplir contraste WCAG 2.1 AA. | Medición de todos los tokens, combinaciones y estados. |
| A11Y-006 | La interfaz debe operar con zoom y viewports móviles sin pérdida de contenido o función. | Matriz responsive y zoom al 200 %. |
| A11Y-007 | Los diálogos deben gestionar entrada, confinamiento y retorno de foco. | Prueba manual y automatizada por diálogo. |
| A11Y-008 | Imágenes funcionales, incluido QR MFA, deben tener alternativa o instrucciones contextuales. | Revisión de markup y flujo alternativo. |

## Usabilidad para recepción

La prioridad es reducir la carga cognitiva durante una llamada. La interfaz debe:

1. Solicitar primero servicio, fecha y datos necesarios para calcular disponibilidad.
2. Mostrar solo opciones accionables o explicar por qué una selección está bloqueada.
3. Mantener visible el cliente seleccionado y el resumen de la cita.
4. Diferenciar validación local, conflicto de disponibilidad (`409`) y fallo de red.
5. Confirmar explícitamente una creación exitosa y refrescar la agenda.
6. Evitar que el usuario tenga que recordar información presentada en un paso anterior.

El requisito de completar una reserva en menos de cinco interacciones (`RNF-004`) no ha sido medido y necesita una definición precisa de “interacción”.

## Mensajes y errores

| Situación | Respuesta esperada |
|---|---|
| Campo inválido | Asociar mensaje al campo e indicar cómo corregirlo. |
| Sesión expirada | Informar y dirigir al login sin presentar éxito parcial. |
| Acceso denegado | Explicar falta de permisos sin exponer datos sensibles. |
| Conflicto de cita | Indicar que la franja cambió y ofrecer actualización de agenda. |
| Sin resultados | Diferenciar lista vacía de fallo de carga. |
| Timeout o red | Indicar que no se pudo conectar y permitir reintento seguro. |
| Error del servidor | Mensaje general accionable; no mostrar trazas internas. |

El frontend ya define mensajes por feature y normaliza varias formas de error, pero falta una revisión integral de consistencia y lectura por tecnología asistiva.

## Plan de verificación recomendado

- Auditoría automática como apoyo, no como única evidencia.
- Recorridos manuales de teclado en Chrome y Firefox actuales.
- Pruebas con al menos un lector de pantalla disponible en el entorno objetivo.
- Matriz de contraste para tokens, hover, focus, disabled, error y success.
- Viewports representativos de escritorio, tableta y móvil, más zoom.
- Registro de hallazgos por ruta, severidad, criterio WCAG y evidencia de corrección.

## Límites de seguridad y accesibilidad

El escape HTML reduce riesgo en los puntos donde se aplica, pero no existe una auditoría exhaustiva de sinks DOM. Del mismo modo, atributos ARIA aislados no garantizan una experiencia accesible y no deben reemplazar elementos HTML nativos apropiados.

Referencias: [Sistema de diseño](../estilos/sistema-de-diseno.md), [Estrategia de pruebas](estrategia-de-pruebas.md) y [RNF](../analisis/analisis-y-requisitos.md#7-requisitos-no-funcionales).