# PRD: Módulo de Gestión de Citas y Panel Principal

## 1. Problema
El proceso manual de agendamiento genera deficiencias y errores críticos de concurrencia (doble reserva de empleados o solapamiento en el uso de recursos físicos limitados como lavacabezas). Además, se requiere un panel de acceso unificado que diferencie las capacidades operativas entre administradores y recepcionistas.

## 2. Objetivos
- Automatizar el agendamiento y reducir el tiempo de este proceso en un 50% (RNF-002).
- Eliminar el 100% de los errores de doble reserva mediante un "Motor de Control de Concurrencia" visual.
- Proveer una interfaz rápida y adaptable (Responsive) para el uso en tabletas por parte de recepción.

## 3. Alcance (Scope)
- **EN ALCANCE:** Panel de agendamiento (Calendario) para Recepcionista con validación de concurrencia. Dashboard administrativo para el Dueño/a (gestión de empleados, recursos y servicios). Gestión rápida de clientes durante la reserva.
- **FUERA DE ALCANCE:** Portal web público de autogestión para clientes externos. Integración con pasarelas de pago. Módulos de facturación o inventario de productos.

## 4. Casos de Uso y Experiencia de Usuario (UX)
1. **Rol Recepcionista (Operativo):**
   - Al iniciar sesión, ve inmediatamente la agenda en vista de calendario (diaria/semanal).
   - Puede filtrar la agenda por `Servicio`, lo que automáticamente oculta a los empleados que no tienen dicha especialidad.
   - Al intentar agendar, el sistema cruza la duración del servicio con el horario del empleado y la disponibilidad del recurso. Si hay solapamiento, el bloque se marca en ROJO y bloquea la acción.
   - Puede crear un cliente nuevo "al vuelo" si no existe al momento de agendar.
2. **Rol Dueño/a (Administrativo):**
   - Al iniciar sesión (con verificación MFA requerida), ve el Dashboard de gestión de maestros.
   - Puede crear empleados, definir sus franjas laborales y calificaciones.
   - Puede definir los recursos físicos (ej. 2 Lavacabezas) y los servicios.

## 5. Requerimientos Funcionales y Endpoints
El frontend consumirá los siguientes endpoints de la API REST (`/api/v1`):
- **Motor de Disponibilidad:** `GET /disponibilidad?fecha={fecha}&idServicio={id}`. Retorna horarios libres validando empleado, franja laboral y recursos.
- **Gestión de Citas:** `GET`, `POST`, `PUT`, `DELETE` en `/citas`. La creación valida automáticamente la regla de concurrencia en el backend.
- **Gestión de Clientes:** `GET /clientes/buscar` (por documento/teléfono) y `POST /clientes` durante el agendamiento.
- **Regla Estricta de UI:** La interfaz solo debe permitir seleccionar horarios que hayan pasado la validación dual (Empleado Y Recurso).

## 6. Requerimientos No Funcionales
- **Rendimiento:** La vista de la agenda debe cargar en máximo 1.5 segundos (RNF-001).
- **Velocidad de Búsqueda:** El motor de disponibilidad debe actualizar los intervalos visuales en menos de 0.5 segundos (RNF-005).
- **Usabilidad:** Diseño estrictamente adaptable (Responsive) optimizado para Tabletas y Navegadores modernos (RNF-007).
- **Manejo de Errores:** Interceptar códigos HTTP 409 (Conflictos de solapamiento) y 400 (Bad Request) para mostrar notificaciones amigables en español (RNF-015).
- **Seguridad:** Enviar siempre el token JWT en el header `Authorization: Bearer`. Redirigir al login si se recibe un código 401.

## 7. Criterios de Aceptación
- [ ] Dado que se selecciona el servicio "Corte y Tinte", solo se muestran empleados calificados para ese servicio.
- [ ] Dado que el Recurso Físico "Lavacabezas" tiene `cantidadTotal = 1` y está en uso de 10:00 a 11:00, el sistema debe impedir visualmente agendar cualquier otra cita que requiera ese recurso a esa misma hora, sin importar si el empleado está libre.
- [ ] Tras guardar una cita exitosamente con `POST /citas`, el calendario se refresca y muestra el bloque ocupado.
- [ ] El código frontend respeta estrictamente la Architecture definida en los `SKILL.md` (separación de Controller, View y Service).